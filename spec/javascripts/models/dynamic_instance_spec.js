describe("chorus.models.DynamicInstance", function() {
    it("should return a gpdb data source when the entity_type is gpdb_data_source", function() {
        var model = new chorus.models.DynamicInstance({entityType: "gpdb_data_source"});
        expect(model).toBeA(chorus.models.GpdbDataSource);
    });

    it("should return a hadoop data source when the entity_type is hadoop_instance", function() {
        var model = new chorus.models.DynamicInstance({entityType: "hadoop_instance"});
        expect(model).toBeA(chorus.models.HadoopInstance);
    });

    it("should return a gnip data source when the entity_type is gnip_instance", function() {
        var model = new chorus.models.DynamicInstance({entityType: "gnip_instance"});
        expect(model).toBeA(chorus.models.GnipInstance);
    });

    it("should return an oracle data source when the entity_type is oracle_data_source", function() {
        var model = new chorus.models.DynamicInstance({entityType: "oracle_data_source"});
        expect(model).toBeA(chorus.models.OracleDataSource);
    });
});