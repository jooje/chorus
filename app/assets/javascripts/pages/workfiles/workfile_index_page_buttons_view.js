chorus.views.WorkfileIndexPageButtons = chorus.views.Base.extend({
    constructorName: "WorkfileIndexPageButtons",
    templateName: "workfile_index_page_buttons",
    createActions: [
        {className: 'create_sql_workfile', text: t("actions.create_sql_workfile")}
    ],

    events: {
        "click button.import_workfile": "launchWorkfileImportsDialog"
    },

    menuEvents: {
        "a.create_sql_workfile": function(e) {
            e && e.preventDefault();
            new chorus.dialogs.WorkfilesSqlNew({workspaceId: this.model.get('id')}).launchModal();
        },
        "a.create_work_flow": function(e) {
            e && e.preventDefault();
            new chorus.dialogs.WorkFlowNew({workspace: this.model}).launchModal();
        }
    },

    setup: function() {
        this.model.fetchIfNotLoaded();
    },

    postRender: function() {
        this.menu(this.$('.new_workfile'), {
            content: this.$(".create_workfile_menu"),
            orientation: "right",
            contentEvents: this.menuEvents
        });
    },

    canUpdate: function() {
        return this.model.loaded && this.model.canUpdate() && this.model.isActive();
    },

    currentUserCanCreateWorkFlows: function() {
        return this.model.loaded && this.model.currentUserCanCreateWorkFlows();
    },

    additionalContext: function() {
        return {
            canUpdate: this.canUpdate(),
            createActions: this.createActions,
            currentUserCanCreateWorkFlow: this.currentUserCanCreateWorkFlows()
        };
    },

    launchWorkfileImportsDialog: function(e) {
        e && e.preventDefault();
        new chorus.dialogs.WorkfilesImport({workspaceId: this.model.get('id')}).launchModal();
    }
});
