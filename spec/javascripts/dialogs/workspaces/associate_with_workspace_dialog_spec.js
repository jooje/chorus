describe("chorus.dialogs.AssociateWithWorkspace", function() {
    beforeEach(function() {
        this.launchElement = $("<a></a>")
    });

    it("does not re-render when the model changes", function() {
        var dialog = new chorus.dialogs.AssociateWithWorkspace({launchElement: this.launchElement, model: fixtures.datasetSourceTable() });
        expect(dialog.persistent).toBeTruthy()
    });

    describe("intialization", function() {
        it("should complain if it isn't given a model", function() {
            expect(
                function() {
                    new chorus.dialogs.AssociateWithWorkspace({launchElement: this.launchElement });
                }).toThrow();
        });
    });

     describe("after workspaces are fetched", function() {
        context("when the model is a source table/view with multiple workspaces", function() {
            beforeEach(function() {
                this.model = fixtures.datasetSourceTable({workspaceUsed: {
                    workspaceCount: 2,
                    workspaceList: [{id: "123", name: "im_also_the_current_one"},
                        {id: "645", name: "yes_im_the_current_one"}]
                }});
                this.dialog = new chorus.dialogs.AssociateWithWorkspace({launchElement: this.launchElement, model: this.model });
                this.server.completeFetchFor(chorus.session.user().workspaces(), [
                    newFixtures.workspace({ name: "im_also_the_current_one'", id: "123" }),
                    newFixtures.workspace({ name: "im_not_the_current_one" }),
                    newFixtures.workspace({ name: "yes_im_the_current_one", id: "645" })
                ]);
            });
            it("shows all workspaces except for the ones the source table is already associated with", function() {
                expect(this.dialog.$('.collection_picklist li span.name')).not.toContainText("im_also_the_current_one");
                expect(this.dialog.$('.collection_picklist li span.name')).toContainText("im_not_the_current_one");
                expect(this.dialog.$('.collection_picklist li span.name')).not.toContainText("yes_im_the_current_one");
            });
        });
        context("when the model is a source table/view with no workspaces", function() {
            beforeEach(function() {
                this.model = fixtures.datasetSourceTable();
                this.model.unset("workspaceUsed");
                this.dialog = new chorus.dialogs.AssociateWithWorkspace({launchElement: this.launchElement, model: this.model });
                this.server.completeFetchFor(chorus.session.user().workspaces(), [
                    newFixtures.workspace({ name: "im_not_the_current_one'" }),
                    newFixtures.workspace({ name: "me_neither" }),
                    newFixtures.workspace({ name: "yes_im_the_current_one", id: "645" })
                ]);
            });

            it("shows all workspaces", function() {
                expect(this.dialog.$('.collection_picklist li span.name')).toContainText("me_neither");
                expect(this.dialog.$('.collection_picklist li span.name')).toContainText("im_not_the_current_one");
                expect(this.dialog.$('.collection_picklist li span.name')).toContainText("yes_im_the_current_one");
            });
        });
        context("when the model is a sandbox table/view or a chorus view (in a workspace)", function() {
            beforeEach(function() {
                this.model = fixtures.datasetSandboxTable({workspace: {id: "645"}});
                this.dialog = new chorus.dialogs.AssociateWithWorkspace({launchElement: this.launchElement, model: this.model });
                this.server.completeFetchFor(chorus.session.user().workspaces(), [
                    newFixtures.workspace({ name: "im_not_the_current_one'" }),
                    newFixtures.workspace({ name: "me_neither" }),
                    newFixtures.workspace({ name: "yes_im_the_current_one", id: "645" })
                ]);
            });

            it("it shows all workspaces except for the current workspace", function() {
                expect(this.dialog.$('.collection_picklist li span.name')).toContainText("me_neither");
                expect(this.dialog.$('.collection_picklist li span.name')).toContainText("im_not_the_current_one");
                expect(this.dialog.$('.collection_picklist li span.name')).not.toContainText("yes_im_the_current_one");
            });
        });
    });

    describe("clicking Associate Dataset", function() {
        context("for anything except a Chorus View", function() {
            beforeEach(function() {
                this.model = fixtures.datasetSandboxTable();
                this.workspace = newFixtures.workspace();
                this.dialog = new chorus.dialogs.AssociateWithWorkspace({launchElement: this.launchElement, model: this.model });
                this.dialog.render();

                spyOn(chorus, "toast");
                spyOn(this.model.activities(), "fetch");
                spyOn(this.dialog.picklistView, "selectedItem").andReturn(this.workspace);
                this.dialog.picklistView.trigger("item:selected", this.workspace);
                spyOn(chorus.router, "navigate");
                spyOn(this.dialog, "closeModal");
                this.dialog.$("button.submit").click();
            });

            it("calls the API", function() {
                expect(_.last(this.server.requests).url).toMatchUrl("/edc/workspace/" + this.workspace.get("id") + "/dataset");
                expect(_.last(this.server.requests).params()).toEqual({
                    type: "SOURCE_TABLE",
                    instanceId: this.model.get("instance").id.toString(),

                    databaseName: this.model.get("databaseName"),
                    schemaName: this.model.get("schemaName"),
                    objectName: this.model.get("objectName"),
                    objectType: this.model.get("objectType")
                });
                expect(_.last(this.server.requests).method).toBe("POST");
            });

            it("starts loading", function() {
                expect(this.dialog.$("button.submit").isLoading()).toBeTruthy();
                expect(this.dialog.$("button.submit").text()).toMatchTranslation("actions.associating");
            });

            describe("when the API is successful", function() {
                beforeEach(function() {
                    spyOn(chorus.PageEvents, "broadcast");
                    this.server.lastCreate().succeed();
                });

                it("closes the dialog", function() {
                    expect(this.dialog.closeModal).toHaveBeenCalled();
                });

                it("pops toast", function() {
                    expect(chorus.toast).toHaveBeenCalledWith("dataset.associate.toast", {datasetTitle: this.model.get("objectName"), workspaceNameTarget: this.workspace.get("name")});
                });

                it("does not navigate", function() {
                    expect(chorus.router.navigate).not.toHaveBeenCalled();
                });

                it("fetch the activities for the dataset", function() {
                    expect(this.model.activities().fetch).toHaveBeenCalled();
                });

                it("broadcasts workspace:associated without arguments", function() {
                    expect(chorus.PageEvents.broadcast).toHaveBeenCalledWith("workspace:associated");
                });
            });

            describe("when the API fails", function() {
                beforeEach(function() {
                    this.server.lastRequest().fail([
                        {
                            "message": "Workspace already has a workfile with this name. Specify a different name."
                        }
                    ])
                });

                it("does not close the dialog", function() {
                    expect(this.dialog.closeModal).not.toHaveBeenCalled();
                });

                it("does not pop toast", function() {
                    expect(chorus.toast).not.toHaveBeenCalled();
                });

                it("stops loading", function() {
                    expect(this.dialog.$("button.submit").isLoading()).toBeFalsy();
                });

                it("displays the server error message", function() {
                    expect(this.dialog.$(".errors ul").text().trim()).toBe("Workspace already has a workfile with this name. Specify a different name.")
                });
            });
        });

        context("when the dataset is a Chorus View", function() {
            beforeEach(function() {
                this.model = fixtures.datasetChorusView({workspace: newFixtures.workspace({id: "987"})});
                this.workspace = newFixtures.workspace();
                this.dialog = new chorus.dialogs.AssociateWithWorkspace({launchElement: this.launchElement, model: this.model });
                this.dialog.render();

                spyOn(chorus, "toast");
                spyOn(this.model.activities(), "fetch");
                spyOn(this.dialog.picklistView, "selectedItem").andReturn(this.workspace);
                this.dialog.picklistView.trigger("item:selected", this.workspace);
                spyOn(chorus.router, "navigate");
                spyOn(this.dialog, "closeModal");
                this.dialog.$("button.submit").click();
            });

            it("calls the API", function() {
                expect(_.last(this.server.requests).url).toMatchUrl("/edc/workspace/987/dataset/" + this.model.get("id"));
                expect(_.last(this.server.requests).params()).toEqual({
                    targetWorkspaceId: this.workspace.get("id"),
                    objectName: this.model.get("objectName")
                });
                expect(_.last(this.server.requests).method).toBe("POST");
            });
        });
    });
});
