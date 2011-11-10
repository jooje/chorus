describe("chorus.views", function() {
    describe("#context", function() {
        describe("for a view with a model", function() {
            beforeEach(function() {
                this.model = new chorus.models.Base({ bar: "foo"});
                this.view = new chorus.views.Base({ model : this.model });
            });

            it("serializes the attributes of the model", function() {
                expect(this.view.context()).toEqual({ bar: "foo" });
            })

            describe("loaded:true", function() {
                beforeEach(function() {
                    this.model.loaded = true;
                });

                it("returns loaded:true", function() {
                    expect(this.view.context().loaded).toBeTruthy();
                });
            });

            describe("loaded:false", function() {
                beforeEach(function() {
                    this.model.loaded = false;
                });

                it("returns loaded:false", function() {
                    expect(this.view.context().loaded).toBeFalsy();
                });
            });
        })

        describe("for a view with a collection", function () {
            beforeEach(function() {
                this.collection = new chorus.models.Collection([
                    new chorus.models.Base({ bar: "foo"}),
                    new chorus.models.Base({ bro: "baz"})
                ], { custom: "stuff" });
                this.view = new chorus.views.Base({ collection: this.collection });
            });

            it("serializes the attributes of the collection", function() {
                expect(this.view.context().custom).toBe("stuff");
            })

            it("serializes the attributes of the collection objects into the 'models' key", function() {
                var modelContext = this.view.context().models;
                expect(modelContext).not.toBeUndefined();
                expect(modelContext.length).toBe(2);
                expect(modelContext[0]).toEqual({ bar: "foo" });
                expect(modelContext[1]).toEqual({ bro: "baz" });
            })

            describe("loaded:true", function() {
                beforeEach(function() {
                    this.collection.loaded = true;
                });

                it("returns loaded:true", function() {
                    expect(this.view.context().loaded).toBeTruthy();
                });
            });

            describe("loaded:false", function() {
                beforeEach(function() {
                    this.collection.loaded = false;
                });

                it("returns loaded:false", function() {
                    expect(this.view.context().loaded).toBeFalsy();
                });
            });
        })
    })

    describe("MainContentView", function(){
        beforeEach(function(){
            this.loadTemplate("main_content");
        });

        describe("#render", function(){
            beforeEach(function(){
                this.view = new chorus.views.MainContentView();

                this.view.contentHeader = stubView("header text");
                this.view.content = stubView("content text");

                this.view.render();
            });

            context("with a supplied contentHeader", function(){
                it("should render the header", function(){
                    expect(this.view.$("#content_header").text()).toBe("header text");
                });
            });

            context("with a supplied content", function(){
                it("should render the content", function(){
                    expect(this.view.$("#content").text()).toBe("content text");
                });
            });

            context("without a supplied contentDetails", function(){
                it("should have the hidden class on the content_details div", function(){
                    expect((this.view.$("#content_details"))).toHaveClass("hidden");
                });
            });

            context("with a supplied contentDetails", function(){
                beforeEach(function(){
                    this.view.contentDetails = stubView("content details text");
                    this.view.render();
                });

                it("should render the contentDetails", function(){
                    expect((this.view.$("#content_details").text())).toBe("content details text");
                });
            });
        });
    });

})
