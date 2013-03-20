describe("chorus.pages.SearchIndexPage", function() {
    beforeEach(function() {
        this.query = "50/50";
    });

    it("has a helpId", function() {
        this.page = new chorus.pages.SearchIndexPage(this.query);
        expect(this.page.helpId).toBe("search");
    });

    context("when the search returns with unprocessableEntity", function() {
        beforeEach(function() {
            this.page = new chorus.pages.SearchIndexPage(this.query);
            spyOn(Backbone.history, 'loadUrl');
            this.server.lastFetchFor(this.page.model).failUnprocessableEntity();
        });

        it("shows a nice error popup", function() {
            expect(Backbone.history.loadUrl).toHaveBeenCalledWith('/unprocessableEntity');
            expect(chorus.pageOptions.title).toMatchTranslation('search.bad_entity_type.title');
            expect(chorus.pageOptions.text).toMatchTranslation('search.bad_entity_type.text');
        });
    });

    describe("when searching for all items, across all of chorus", function() {
        beforeEach(function() {
            this.page = new chorus.pages.SearchIndexPage(this.query);
        });

        it("fetches the search results for the given query", function() {
            expect(this.page.search.entityType()).toBe("all");
            expect(this.page.search.searchIn()).toBe("all");
            expect(this.page.search).toHaveBeenFetched();
        });

        describe("when the search result fetch completes", function() {
            beforeEach(function() {
                this.server.completeFetchFor(this.page.search, rspecFixtures.searchResult());
            });

            it("doesn't display the list content details", function() {
                expect(this.page.mainContent.contentDetails).toBeUndefined();
            });

            it("has breadcrumbs", function() {
                expect(this.page.$(".breadcrumbs li:eq(0)")).toContainTranslation('breadcrumbs.home');
                expect((this.page.$(".breadcrumbs li:eq(0) a")).attr("href")).toBe("#/");

                expect(this.page.$(".breadcrumbs li:eq(1) .slug")).toContainTranslation('breadcrumbs.search_results');
            });

            it("has the right title", function() {
                expect(this.page.$(".default_content_header h1")).toContainTranslation("search.index.title", {query: "50/50"});
            });

            it("has a 'Show All Results' link", function() {
                expect(this.page.$('.default_content_header .type .title')).toContainTranslation("search.show");
                expect(this.page.$('.default_content_header .type a')).toContainTranslation("search.type.all");
            });

            it("has filtered result links", function() {
                expect(this.page.$('.default_content_header .type a')).toContainTranslation("search.type.workfile");
                expect(this.page.$('.default_content_header .type a')).toContainTranslation("search.type.hdfs_entry");
                expect(this.page.$('.default_content_header .type a')).toContainTranslation("search.type.dataset");
                expect(this.page.$('.default_content_header .type a')).toContainTranslation("search.type.workspace");
                expect(this.page.$('.default_content_header .type a')).toContainTranslation("search.type.user");
                expect(this.page.$('.default_content_header .type a')).toContainTranslation("search.type.instance");
            });

            describe("filtering by result type", function() {
                beforeEach(function() {
                    spyOn(chorus.router, "navigate");
                    this.page.$('.default_content_header li[data-type="workspace"] a').click();
                });

                it("should navigate to the filtered result type page", function() {
                    expect(this.page.search.entityType()).toBe("workspace");
                    expect(this.page.search.searchIn()).toBe("all");
                    expect(chorus.router.navigate).toHaveBeenCalledWith(this.page.search.showUrl());
                });
            });

            it("has a 'Search in' filter link", function() {
                var searchInMenu = this.page.$(".default_content_header .search_in");
                var searchInOptions = searchInMenu.find(".menu a");
                expect(searchInMenu.find(".chosen")).toContainTranslation("search.in.all");
                expect(searchInMenu.find(".title")).toContainTranslation("search.search_in");
                expect(searchInOptions.length).toBe(2);
                expect(searchInOptions).toContainTranslation("search.in.all");
                expect(searchInOptions).toContainTranslation("search.in.my_workspaces");
            });

            it("navigates to the right page when 'my workspaces' is selected from the 'search in' menu", function() {
                spyOn(chorus.router, "navigate");
                chorus.PageEvents.broadcast("choice:search_in", "my_workspaces");
                expect(this.page.search.entityType()).toBe("all");
                expect(this.page.search.searchIn()).toBe("my_workspaces");
                expect(chorus.router.navigate).toHaveBeenCalledWith(this.page.search.showUrl());
            });

            describe("the workfile section", function() {
                beforeEach(function() {
                    this.workfileLIs = this.page.$(".workfile_list li");
                });

                it("shows a list of search results", function() {
                    expect(this.workfileLIs.length).toBeGreaterThan(0);
                });

                it("selects the first workfile by default", function() {
                    expect(this.workfileLIs.eq(0)).toHaveClass("selected");
                });

                describe("clicking on a workfile search result", function() {
                    beforeEach(function() {
                        this.searchedWorkfile = this.workfileLIs.eq(2);
                        this.searchedWorkfile.trigger("click");
                    });

                    it("selects that workfile", function() {
                        expect(this.searchedWorkfile).toHaveClass("selected");
                    });

                    it("shows that workfile in the sidebar", function() {
                        var workfileName = this.searchedWorkfile.find('a.name').text();
                        expect(this.page.sidebar.$(".fileName")).toHaveText(workfileName);
                    });

                    it('shows the right links', function(){
                        expect(this.page.sidebar.$('.actions')).toContainTranslation('actions.copy_to_another_workspace');
                        expect(this.page.sidebar.$('.actions')).toContainTranslation('actions.download');
                        expect(this.page.sidebar.$('.actions')).not.toContainTranslation('actions.add_note');
                        expect(this.page.sidebar.$('.actions')).not.toContainTranslation('workfile.delete.button');
                    });

                    it("sets the workfile as the selectedItem on the search result", function() {
                        expect(this.page.search.selectedItem).toBe(this.page.search.workfiles().at(2));
                    });
                });
            });

            describe("the workspace section", function() {
                beforeEach(function() {
                    this.workspaceLIs = this.page.$(".workspace_list li");
                });

                it("shows a list of search results", function() {
                    expect(this.workspaceLIs.length).toBeGreaterThan(0);
                });

                describe("clicking on a workspace search result", function() {
                    beforeEach(function() {
                        this.workspaceLIs.eq(1).trigger("click");
                    });

                    it("selects that workspace", function() {
                        expect(this.workspaceLIs.eq(1)).toHaveClass("selected");
                    });

                    it("shows that workspace in the sidebar", function() {
                        expect(this.page.sidebar.$(".info .name")).toHaveText("Private");
                    });

                    it("show the 'add a note' link in the sidebar", function() {
                        expect(this.page.sidebar.$("a[data-dialog='NotesNew']")).toExist();
                    });

                    it("show the 'add an insight' link in the sidebar", function() {
                        expect(this.page.sidebar.$("a[data-dialog='InsightsNew']")).toExist();
                    });
                });
            });

            describe("the dataset section", function() {
                beforeEach(function() {
                    this.datasetLIs = this.page.$(".dataset_list li");
                });

                it("shows a list of search results", function() {
                    expect(this.datasetLIs.length).toBeGreaterThan(0);
                });

                describe("clicking on a tabular data search result", function() {
                    beforeEach(function() {
                        this.datasetLIs.eq(1).trigger("click");
                        this.dataset = this.page.model.datasets().at(1);
                        //The sidebar requires extra setup for a chorus view
                        expect(this.dataset.isChorusView()).toBeFalsy();
                    });

                    it("selects that tabular data item", function() {
                        expect(this.datasetLIs.eq(1)).toHaveClass("selected");
                    });

                    it("shows the tabular data item in the sidebar", function() {
                        var name = this.dataset.name();
                        expect(name.length).toBeGreaterThan(0);
                        expect(this.page.sidebar.$(".info .name")).toHaveText(name);
                    });

                    it("shows the associate-with-workspace link in the sidebar", function() {
                        expect(this.page.sidebar.$('a.associate')).toExist();
                    });
                });
            });

            describe('the data source section', function() {
                beforeEach(function() {
                    this.instanceLIs = this.page.$(".instance_list li");
                });

                it("shows a list of search results", function() {
                    expect(this.instanceLIs.length).toBe(3);
                });

                describe('clicking on a data source search result', function() {
                    beforeEach(function() {
                        spyOn(this.page.sidebars.instance, "setInstance");
                        this.instanceLIs.eq(0).trigger("click");
                    });

                    it('selects that data source', function() {
                        expect(this.instanceLIs.eq(0)).toHaveClass("selected");
                    });

                    it('shows the data source in the sidebar', function() {
                        expect($(this.page.sidebar.el)).toHaveClass("data_source_list_sidebar");
                        expect(this.page.sidebars.instance.setInstance).toHaveBeenCalledWith(this.page.search.instances().at(0));
                    });
                });
            });

            describe("the user section", function() {
                beforeEach(function() {
                    this.users = this.page.search.users();
                    this.userLis = this.page.$(".user_list li");
                });

                it("shows a list of search results", function() {
                    expect(this.userLis.length).toBeGreaterThan(0);
                });

                describe("clicking on a user search result", function() {
                    beforeEach(function() {
                        this.clickedUser = this.users.at(0);
                        this.userLis.eq(0).trigger("click");
                    });

                    it("selects that user", function() {
                        expect(this.userLis.eq(0)).toHaveClass("selected");
                    });

                    it("fetches the user's activities'", function() {
                        expect(this.clickedUser.activities()).toHaveBeenFetched();
                    });

                    describe("when all of the sidebar's fetches complete", function() {
                        beforeEach(function() {
                            this.server.completeFetchFor(this.clickedUser.activities(), []);
                            this.server.completeFetchFor(chorus.models.Config.instance());
                        });

                        it("shows that user in the sidebar", function() {
                            expect(this.page.sidebar.$(".info .full_name")).toHaveText(this.users.at(0).displayName());
                        });
                    });
                });
            });

            describe("the hdfs section", function() {
                beforeEach(function() {
                    this.files = this.page.search.hdfs_entries();
                    this.fileLis = this.page.$(".hdfs_list li");
                });

                it("shows a list of search results", function() {
                    expect(this.fileLis.length).toBe(1);
                });

                describe("clicking on a file search result", function() {
                    beforeEach(function() {
                        this.clickedFile = this.files.at(0);
                        this.fileLis.eq(0).trigger("click");
                    });

                    it("selects that file", function() {
                        expect(this.fileLis.eq(0)).toHaveClass("selected");
                    });

                    it("fetches the file's activities'", function() {
                        expect(this.clickedFile.activities()).toHaveBeenFetched();
                    });

                    describe("when all of the sidebar's fetches complete", function() {
                        beforeEach(function() {
                            this.server.completeFetchFor(this.clickedFile.activities(), []);
                        });

                        it("shows that file in the sidebar", function() {
                            expect(this.page.sidebar.$(".info .name")).toHaveText(this.clickedFile.get('name'));
                        });
                    });
                });
            });

            describe("the other files section", function() {
                beforeEach(function() {
                    this.attachments = this.page.search.attachments();
                    this.attachmentLis = this.page.$(".attachment_list li");
                });

                it("shows a list of search results", function() {
                    expect(this.attachmentLis.length).toBe(7);
                });

                describe("clicking on a search result", function() {
                    beforeEach(function() {
                        this.clickedFile = this.attachments.at(0);
                        this.attachmentLis.eq(0).trigger("click");
                    });

                    it("selects that file", function() {
                        expect(this.attachmentLis.eq(0)).toHaveClass("selected");
                    });

                    it("shows that file in the sidebar", function() {
                        expect(this.page.sidebar.$(".info .name")).toHaveText(this.clickedFile.get("name"));
                    });
                });
            });
        });
    });

    describe("when searching for only workspaces, across all of chorus", function() {
        beforeEach(function() {
            this.page = new chorus.pages.SearchIndexPage("all", "workspace", this.query);
        });

        it("fetches from the right search url", function() {
            expect(this.page.search.entityType()).toBe("workspace");
            expect(this.page.search.searchIn()).toBe("all");
            expect(this.page.search).toHaveBeenFetched();
        });

        describe("when the search result is fetched", function() {
            beforeEach(function() {
                this.server.completeFetchFor(this.page.search, rspecFixtures.searchResult());
            });

            it("selects the 'all of chorus' option in the 'search in' menu", function() {
                expect(this.page.$(".default_content_header .search_in .chosen")).toContainTranslation("search.in.all");
            });

            it("selects the search result type in the menu", function() {
                expect(this.page.$(".default_content_header .type .chosen")).toContainTranslation("search.type.workspace");
            });

            it("has a content details and footer with pagination controls", function() {
                expect(this.page.mainContent.contentDetails).toBeA(chorus.views.ListContentDetails);
                expect(this.page.mainContent.contentDetails.collection).toBe(this.page.search.workspaces());
                expect(this.page.mainContent.contentDetails.options.modelClass).toBe("SearchResult");

                expect(this.page.mainContent.contentFooter).toBeA(chorus.views.ListContentDetails);
                expect(this.page.mainContent.contentFooter.collection).toBe(this.page.search.workspaces());
                expect(this.page.mainContent.contentFooter.options.hideCounts).toBeTruthy();
                expect(this.page.mainContent.contentFooter.options.hideIfNoPagination).toBeTruthy();
                expect(this.page.mainContent.contentFooter.options.modelClass).toBe("SearchResult");
            });
        });
    });

    describe("when searching for all items in the current user's workspaces", function() {
        beforeEach(function() {
            this.page = new chorus.pages.SearchIndexPage("my_workspaces", "all", this.query);
            this.search = this.page.search;
        });

        it("fetches the right search result", function() {
            expect(this.search.searchIn()).toBe("my_workspaces");
            expect(this.search.entityType()).toBe('all');
            expect(this.search).toHaveBeenFetched();
        });

        describe("when the search result is fetched", function() {
            beforeEach(function() {
                this.server.completeFetchFor(this.page.search, rspecFixtures.searchResult());
            });

            it("selects the 'my workspaces' option in the 'search in' menu", function() {
                expect(this.page.$(".default_content_header .search_in .chosen")).toContainTranslation("search.in.my_workspaces");
            });

            it("selects the search result type in the menu", function() {
                expect(this.page.$(".default_content_header .type .chosen")).toContainTranslation("search.type.all");
            });
        });
    });

    describe("when searching only for workfiles in the current user's workspaces", function() {
        beforeEach(function() {
            this.page = new chorus.pages.SearchIndexPage("my_workspaces", "workfile", this.query);
            this.search = this.page.search;
            spyOn(this.search, "workspace").andReturn(rspecFixtures.workspace());
        });

        it("fetches the right search result", function() {
            expect(this.search.searchIn()).toBe("my_workspaces");
            expect(this.search.entityType()).toBe("workfile");
            expect(this.search).toHaveBeenFetched();
        });

        describe("when the search result is fetched", function() {
            beforeEach(function() {
                this.server.completeFetchFor(this.page.search, rspecFixtures.searchResult());
            });

            it("selects the 'my workspaces' option in the 'search in' menu", function() {
                expect(this.page.$(".default_content_header .search_in .chosen")).toContainTranslation("search.in.my_workspaces");
            });

            it("selects the search result type in the menu", function() {
                expect(this.page.$(".default_content_header .type .chosen")).toContainTranslation("search.type.workfile");
            });

            it("doesn't display the list content details", function() {
                expect(this.page.mainContent.contentDetails).toBeUndefined();
            });
        });
    });

    describe("multiple selection", function() {
        beforeEach(function() {
            this.page = new chorus.pages.SearchIndexPage(this.query);
            this.server.completeFetchFor(this.page.search, rspecFixtures.searchResult());
        });

        it("does not display the multiple selection menu until items have been selected", function() {
            expect(this.page.$(".multiple_selection")).toHaveClass("hidden");
        });

        context("when an item has been checked", function() {
            beforeEach(function() {
                this.workfile = rspecFixtures.workfile.sql();
                this.selectedModels = new chorus.collections.Base([this.workfile]);
                chorus.PageEvents.broadcast("checked", this.selectedModels);
            });

            it("displays the multiple selection section", function() {
                expect(this.page.$(".multiple_selection")).not.toHaveClass("hidden");
            });

            it("has an action to edit tags", function() {
                expect(this.page.$(".multiple_selection a.edit_tags")).toExist();
            });

            describe("clicking the 'edit_tags' link", function() {
                beforeEach(function() {
                    this.modalSpy = stubModals();
                    this.page.$(".multiple_selection a.edit_tags").click();
                });

                it("launches the dialog for editing tags", function() {
                    expect(this.modalSpy).toHaveModal(chorus.dialogs.EditTags);
                    expect(this.modalSpy.lastModal().collection).toBe(this.page.multiSelectSidebarMenu.selectedModels);
                });
            });
        });
    });

    describe(".resourcesLoaded", function() {
        beforeEach(function() {
            this.page = new chorus.pages.SearchIndexPage(this.query);
            this.page.resourcesLoaded();
        });

        it("sets the searchPage option for DatasetSidebar to true", function() {
            expect(this.page.sidebars.dataset.options.searchPage).toEqual(true);
        });
    });
});
