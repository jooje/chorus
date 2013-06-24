describe("chorus.views.LocationPicker.DataSourceView", function() {

    beforeEach(function() {
        this.gpdbDataSource = backboneFixtures.gpdbDataSource();
        this.hdfsDataSource = backboneFixtures.hdfsDataSource();
    });

    context("when 'showHdfsDataSources' is true", function() {
        beforeEach(function() {
           this.databasePicker = jasmine.createSpyObj('DatabaseView', ['hide']);
           this.view = new chorus.views.LocationPicker.DataSourceView({
               showHdfsDataSources: true,
               childPicker: this.databasePicker
           });
        });

        it("should fetch both hdfs and gpdb data sources", function() {
            expect(this.server.requests.length).toBe(2);
        });

        context("selecting an HDFS data source", function() {
            beforeEach(function() {
                this.server.completeFetchAllFor(this.view.gpdbDataSources, [this.gpdbDataSource]);
                this.server.completeFetchAllFor(this.view.hdfsDataSources, [this.hdfsDataSource]);
                this.view.render();
                this.databasePicker.hide.reset();
                this.view.$('select').prop('selectedIndex', 2).change();
            });

            it("hides the database selector", function() {
                expect(this.databasePicker.hide).toHaveBeenCalled();
            });
        });
    });

    context("when 'showHdfsDataSources' is false", function() {
        beforeEach(function() {
           this.view = new chorus.views.LocationPicker.DataSourceView({
               showHdfsDataSources: false
           });
           this.server.completeFetchAllFor(this.view.gpdbDataSources, [this.gpdbDataSource]);
        });

        it("should fetch only gpdb data sources", function() {
            expect(this.server.requests.length).toBe(1);
        });

        it("it should only show the gpdb data sources", function() {
            expect(this.view.collection.length).toBeGreaterThan(0);
            this.view.collection.each(function(dataSource) {
                expect(dataSource.entityType).toBe("gpdb_data_source");
            });
        });
    });

    context("when there is a default data source", function() {
        beforeEach(function() {
            var childPicker = new chorus.views.LocationPicker.DatabaseView();
            this.view = new chorus.views.LocationPicker.DataSourceView({
               showHdfsDataSources: false,
               childPicker: childPicker
            });
            this.view.setSelection(this.gpdbDataSource);
            this.server.completeFetchAllFor(this.view.gpdbDataSources, [this.gpdbDataSource]);
            this.view.render();
        });

        it("should pre-populate the selector", function() {
            expect(this.view.getSelectedDataSource().get("id")).toBe(this.gpdbDataSource.id);
            expect(this.view.getSelectedDataSource().get("entityType")).toBe(this.gpdbDataSource.entityType);
        });
    });
});