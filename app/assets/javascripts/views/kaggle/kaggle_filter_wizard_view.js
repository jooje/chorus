chorus.views.KaggleFilterWizard = chorus.views.FilterWizard.extend({
    title: "kaggle.filter.title",

    setup: function() {
        this.collection = this.collection || this.filterCollection();
        this.columnSet = new chorus.collections.KaggleColumnSet();
    },
    filterView: function(filter) {
        return new chorus.views.KaggleFilter({model: filter});
    },

    filterModel: function() {
        return new chorus.models.KaggleFilter();
    },

    filterCollection: function() {
        return new chorus.collections.KaggleFilterSet();
    }
});