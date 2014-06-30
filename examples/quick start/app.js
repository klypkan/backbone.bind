// An example Backbone application with uses Backbone.bind.js
// This demo uses a simple
// [LocalStorage adapter](backbone.localstorage.js)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function () {
    //Model Person
    var Person = Backbone.Model.extend({
        validate: function (attrs, options) {
            var isValid = true;
            var errors = { modelErrors: [], propErrors: {} };
            if (!attrs.firstName) {
                isValid = false;
                errors.propErrors["firstName"] = "firstName field is required.";
            }

            if (!isValid) {
                return errors;
            }
        }
    });

    //Person Collection
    var PersonList = Backbone.Collection.extend({
        // Reference to this collection's model.
        model: Person,

        // The collection of persons is backed by *localStorage* instead of a remote server.
        localStorage: new Backbone.LocalStorage("PersonCollection"),

        //Persons are sorted by their original insertion order.
        comparator: function (person) {
            return person.get('firstName');
        }
    });

    var persons = new PersonList();
    persons.create({ id: 1, firstName: "Bob", color: "Yellow", married: false, employed: "Yes" });
    persons.create({ id: 2, firstName: "Patrick", color: "Pink", married: true, employed: "No" });

    var personEditView = null;

    // Person Item View
    var PersonView = Backbone.View.extend({
        tagName: "tr",
        className: "data-row",

        // The DOM events specific to an item.
        events: {
            "click .btnEdit": "editPerson"
        },

        initialize: function () {
            this.listenTo(this.model, 'sync', this.render);
        },

        template: _.template($('#item-template').html()),

        render: function () {
            this.$el.html(this.template(this.model.attributes));
            return this;
        },

        editPerson: function () {
            if (personEditView != null) {
                personEditView.undelegateEvents();
            }
            personEditView = new PersonEditView({ model: this.model });
        }
    });

    // Person Edit View
    var PersonEditView = Backbone.View.extend({
        el: $("#person-edit"),

        // The DOM events specific to an item.
        events: {
            "click #btnSave": "savePerson",
            "click #btnReset": "resetPerson",
            "click #btnCancel": "cancelPerson"
        },

        initialize: function () {
            this.render();
        },

        render: function () {
            this.bind();
            this.$el.css('display', 'block');
            return this;
        },

        showErrors: function (errors) {
            var attrName = "name";
            var propClassError = "input-validation-error";
            var el = null;
            var propName = null;
            var propError = null;
            this.$el.find("[" + attrName + "]").each(function (index) {
                el = $(this);
                propName = el.attr(attrName);
                propError = errors.propErrors[propName];
                if (propError) {
                    el.addClass(propClassError);
                }
                else {
                    el.removeClass(propClassError);
                }
            });
        },

        savePerson: function () {
            if (this.model.isValid()) {
                this.model.save();
                this.close();
            }
            else {
                this.showErrors(this.model.validationError);
            }
        },

        resetPerson: function () {
            this.model.fetch();
        },

        cancelPerson: function () {
            persons.fetch({ reset: true });
            this.close();
        },

        close: function () {
            this.$el.css('display', 'none');
        }
    });

    //Person Collection View
    var PersonListView = Backbone.View.extend({
        el: $("#person-items"),

        initialize: function () {
            this.listenTo(persons, 'reset', this.addAll);
            persons.fetch({ reset: true });
        },

        addOne: function (person) {
            var personView = new PersonView({ model: person });
            $("#person-items > tbody").append(personView.render().el);
        },

        addAll: function () {
            this.$el.find('tr[class~="data-row"]').remove();
            persons.each(this.addOne);
        }
    });

    var personListView = new PersonListView();
});
