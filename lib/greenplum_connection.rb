require_relative 'data_source_connection'

class GreenplumConnection < DataSourceConnection

  DatabaseError = Error
  class DatabaseError
    def error_type
      error_code = wrapped_exception && wrapped_exception.respond_to?(:get_sql_state) && wrapped_exception.get_sql_state
      case error_code
        when '28P01' then :INVALID_PASSWORD
        when '3D000' then :DATABASE_MISSING
        when '53300' then :TOO_MANY_CONNECTIONS
        when /42.../ then :INVALID_STATEMENT
        when /08.../ then :INSTANCE_UNREACHABLE
        else :GENERIC
      end
    end

    def to_s
      sanitize_message super
    end

    def message
      sanitize_message super
    end

    private

    def sanitize_message(message)
      message.gsub /(user|password)=\S*?(?=[&\s]|\Z)/, '\\1=xxxx'
    end
  end

  class ObjectNotFound < StandardError; end

  @@gpdb_login_timeout = 10

  def self.gpdb_login_timeout
    @@gpdb_login_timeout
  end

  def initialize(details)
    @settings = details
  end

  def connect!
    @connection ||= Sequel.connect db_url, logger_options.merge({:test => true})
  end

  def disconnect
    @connection.disconnect if @connection
    @connection = nil
  end

  def connected?
    !!@connection
  end

  def fetch(sql, parameters = {})
    with_connection { @connection.fetch(sql, parameters).all }
  end

  def fetch_value(sql)
    result = with_connection { @connection.fetch(sql).limit(1).first }
    result && result.first[1]
  end

  def execute(sql)
    with_connection { @connection.execute(sql) }
    true
  end

  private

  def logger_options
    if @settings[:logger]
      { :logger => @settings[:logger], :sql_log_level => :debug }
    else
      {}
    end
  end

  def with_connection
    connect!
    if(schema_name)
      @connection.default_schema = schema_name
      @connection.execute("SET search_path TO '#{schema_name}'")
    end
    yield
  ensure
    disconnect
  end

  def db_url
    query_params = URI.encode_www_form(:user => @settings[:username], :password => @settings[:password], :loginTimeout => GreenplumConnection.gpdb_login_timeout)
    "jdbc:postgresql://#{@settings[:host]}:#{@settings[:port]}/#{@settings[:database]}?" << query_params
  end

  module DatabaseMethods
    def schemas
      with_connection { @connection.fetch(SCHEMAS_SQL).map { |row| row[:schema_name] } }
    end

    def create_schema(name)
      with_connection { @connection.create_schema(name) }
      true
    end

    def drop_schema(name)
      with_connection { @connection.drop_schema(name, :if_exists => true) }
      true
    end

    def schema_exists?(name)
      schemas.include? name
    end

    private

    SCHEMAS_SQL = <<-SQL
      SELECT
        schemas.nspname as schema_name
      FROM
        pg_namespace schemas
      WHERE
        schemas.nspname NOT LIKE 'pg_%'
        AND schemas.nspname NOT IN ('information_schema', 'gp_toolkit', 'gpperfmon')
      ORDER BY lower(schemas.nspname)
    SQL
  end

  module InstanceMethods
    def databases
      with_connection { @connection.fetch(DATABASES_SQL).map { |row| row[:database_name] } }
    end

    private

    DATABASES_SQL = <<-SQL
      SELECT
        datname as database_name
      FROM
        pg_database
      WHERE
        datallowconn IS TRUE AND datname NOT IN ('postgres', 'template1')
        ORDER BY lower(datname) ASC
    SQL
  end

  module SchemaMethods
    def functions
      with_connection { @connection.fetch(SCHEMA_FUNCTIONS_SQL, :schema => schema_name).all }
    end

    def disk_space_used
      with_connection { @connection.fetch(SCHEMA_DISK_SPACE_QUERY, :schema => schema_name).single_value }
    end

    def create_view(view_name, query)
      with_schema_connection { @connection.create_view(view_name, query) }
      true
    end

    def create_external_table(options)
      with_schema_connection do
        @connection.execute(<<-SQL)
          CREATE EXTERNAL TABLE "#{schema_name}"."#{options[:table_name]}"
          (#{options[:columns]}) LOCATION ('#{options[:location_url]}') FORMAT 'TEXT'
          (DELIMITER '#{options[:delimiter]}')
        SQL
      end
      true
    end

    def table_exists?(table_name)
      with_schema_connection { @connection.table_exists?(table_name.to_s) }
    end

    def view_exists?(view_name)
      with_schema_connection { @connection.views.map(&:to_s).include? view_name }
    end

    def analyze_table(table_name)
      execute(%Q{ANALYZE "#{schema_name}"."#{table_name}"})
    end

    def truncate_table(table_name)
      execute(%Q{TRUNCATE TABLE "#{schema_name}"."#{table_name}"})
      true
    end

    def drop_table(table_name)
      with_schema_connection { @connection.drop_table(table_name, :if_exists => true) }
      true
    end

    def stream_table(table_name, limit = nil, &block)
      sql = "SELECT * FROM \"#{table_name}\""
      sql = sql + " LIMIT #{limit}" if limit
      with_schema_connection { @connection.fetch(sql).each(&block) }
      true
    end

    def test_transaction
      connect!
      result = nil

      @connection.transaction(:rollback => :always) do
        result = yield self
      end

      disconnect
      result
    rescue Sequel::DatabaseError => e
      raise GreenplumConnection::DatabaseError.new(e.message) unless e.message =~ /transaction is aborted/
    ensure
      disconnect
    end

    private

    def schema_name
      @settings[:schema]
    end

    def with_schema_connection
      with_connection do
        @connection.default_schema = schema_name
        @connection.execute("SET search_path TO '#{schema_name}'")
        yield
      end
    end

    SCHEMA_FUNCTIONS_SQL = <<-SQL
      SELECT t1.oid, t1.proname, t1.lanname, t1.rettype, t1.proargnames, (SELECT t2.typname ORDER BY inputtypeid) AS argtypes, t1.prosrc, d.description
        FROM ( SELECT p.oid,p.proname,
           CASE WHEN p.proargtypes = '' THEN NULL
               ELSE unnest(p.proargtypes)
               END as inputtype,
           now() AS inputtypeid, p.proargnames, p.prosrc, l.lanname, t.typname AS rettype
         FROM pg_proc p, pg_namespace n, pg_type t, pg_language l
         WHERE p.pronamespace = n.oid
           AND p.prolang = l.oid
           AND p.prorettype = t.oid
           AND n.nspname = :schema) AS t1
      LEFT JOIN pg_type AS t2
      ON t1.inputtype = t2.oid
      LEFT JOIN pg_description AS d ON t1.oid = d.objoid
      ORDER BY t1.oid;
    SQL

    SCHEMA_DISK_SPACE_QUERY = <<-SQL
      SELECT sum(pg_total_relation_size(pg_catalog.pg_class.oid))::bigint AS size
      FROM   pg_catalog.pg_class
      LEFT JOIN pg_catalog.pg_namespace ON relnamespace = pg_catalog.pg_namespace.oid
      WHERE  pg_catalog.pg_namespace.nspname = :schema
    SQL
  end

  include DatabaseMethods
  include InstanceMethods
  include SchemaMethods
end