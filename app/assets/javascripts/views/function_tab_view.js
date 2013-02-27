chorus.views.FunctionTab = chorus.views.DatabaseSidebarList.extend({
    constructorName: "FunctionTabView",
    templateName:"function_tab",
    useLoadingSection:true,

    postRender: function() {
        this._super('postRender', arguments);

        chorus.search({
            list: this.$('ul'),
            input: this.$('input.search')
        });

        this.setupDescriptionPopover();
    },

    setupDescriptionPopover: function() {
        this.$("li .name").qtip({
            events: {
                render: _.bind(function(e, api) {
                    e.preventDefault();
                    e.stopPropagation();
                    var cid = $(api.elements.target).parent().data('cid');
                    var model = this.collection.get(cid);
                    var content = this.tooltipContent(model);
                    $(api.elements.content).html(content);
                }, this),
                show: function(e, api) {
                    $(api.elements.target).addClass('hover');
                },
                hide: function(e, api) {
                    $(api.elements.target).removeClass('hover');
                }
            },
            show: {
                delay: 0,
                effect: false
            },
            hide: {
                delay: 250,
                fixed: true,
                effect: false
            },
            position: {
                viewport: $(window),
                my: "top center",
                at: "bottom left"
            },
            style: {
                classes: "tooltip-function",
                tip: {
                    def: false,
                    height: 5,
                    classes: 'hidden'
                }
            }
        });
    },

    tooltipContent: function(model) {
        var html = chorus.helpers.renderTemplate("function_tab_tooltip", {
            description:_.prune(model.get("description") || '', 100),
            returnType: model.get("returnType"),
            name: model.get("name"),
            argumentsString: model.formattedArgumentList()
        }).toString();
        var content = $("<div/>").html(html);
        content.find("a.more").data("model", model);
        return content;
    },

    collectionModelContext: function(model) {
        return {
            hintText: model.toHintText(),
            cid: model.cid,
            name: model.get("name"),
            fullName: model.toText()
        };
    },

    additionalContext: function() {
        return _.extend(this._super("additionalContext", arguments), {
            hasCollection: !!this.collection,
            error: this.collection && this.collection.serverErrors && this.collection.serverErrors.message
        });
    },

    fetchResourceAfterSchemaSelected: function() {
        this.resource = this.collection = this.schema.functions();
        this.bindings.add(this.resource, "change reset add remove fetchFailed", this.render);
        this.collection.fetchAllIfNotLoaded();
    },

    displayLoadingSection: function () {
        return this.schema && !(this.collection && (this.collection.loaded || this.collection.serverErrors));
    }
});