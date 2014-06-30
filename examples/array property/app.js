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

            var pets = attrs.pets;
            var pet = null;
            for (var i = 0, petsLenght = pets.length; i < petsLenght; i++) {
                pet = pets[i];
                if (!pet.name) {
                    isValid = false;
                    errors.propErrors["pets[" + i + "].name"] = "name field is required.";
                }
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
    persons.localStorage._clear();
    persons.create({ firstName: "Bob", color: "Yellow", married: false, employed: "Yes", pets: [{ name: "Gary", type: "Dog" }] });
    persons.create({ firstName: "Patrick", color: "Pink", married: true, employed: "No", pets: [] });

    var personEditView = null;

    // Person Item View
    var PersonView = Backbone.View.extend({
        tagName: "tr",
        className: "pet-item",

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
            "click #add": "addPet",
            "click #del": "delPet",
            "click #btnSave": "savePerson",
            "click #btnCancel": "cancelPerson"
        },

        templatePetsItem: _.template($('#pet-item-template').html()),

        maxPetsIndex: -1,

        initialize: function () {
            this.render();
        },

        render: function () {
            var petsEl = $('#pets');
            petsEl.find('tr[class~="pet-item"]').remove();
            var pets = this.model.get('pets');
            if (pets) {
                var content = '';
                for (var i = 0, petsLength = pets.length; i < petsLength; i++) {
                    content = content + this.templatePetsItem({ itemIndex: i });
                }
                petsEl.children('tbody').append(content);
            }
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

        addPet: function () {
            var pets = this.model.get('pets');
            pets.push({ name: "", type: "Dog" });
            this.unbind();
            this.render();
        },

        delPet: function () {
            var delPetIndexItems = [];
            var itemEl = null;
            $('#pets input[class~="item-selector"]').each(function (index) {
                itemEl = $(this);
                if (itemEl.prop('checked')) {
                    delPetIndexItems.push(itemEl.parent().children(".item-index").val());
                }
            });
            delPetIndexItems.sort(function (a, b) { return b - a });
            var pets = this.model.get('pets');
            for (var i = 0, delPetIndexItemsLenght = delPetIndexItems.length; i < delPetIndexItemsLenght; i++) {
                pets.splice(delPetIndexItems[i], 1);
            }
            this.render();
        },

        savePerson: function () {
            if (this.model.isValid()) {
                if (this.model.isNew()) {
                    persons.create(this.model.attributes, { wait: true });
                }
                else {
                    this.model.save();
                }
                this.close();
            }
            else {
                this.showErrors(this.model.validationError);
            }
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

        // The DOM events specific to an item.
        events: {
            "click #add-person": "addPerson",
            "click #del-person": "delPerson"
        },

        initialize: function () {
            this.listenTo(persons, 'reset add destroy', this.addAll);
            persons.fetch({ reset: true });
        },

        addOne: function (person) {
            var personView = new PersonView({ model: person });
            $("#person-items > table > tbody").append(personView.render().el);
        },

        addAll: function () {
            this.$el.find('tr[class~="pet-item"]').remove();
            persons.each(this.addOne);
        },

        addPerson: function () {
            if (personEditView != null) {
                personEditView.undelegateEvents();
            }
            personEditView = new PersonEditView({ model: new Person({ color: "Yellow", married: false, employed: "No", pets: [] }) });
        },

        delPerson: function () {
            var itemEl = null;
            this.$el.find('input[class~="item-selector"]').each(function (index) {
                itemEl = $(this);
                if (itemEl.prop('checked')) {
                    var person = persons.get(itemEl.parent().children('.id').val());
                    if (person) {
                        if (personEditView != null
                            && personEditView.model.id == person.id) {
                            personEditView.close();
                        }
                        person.destroy();
                    }
                }
            });
        }
    });

    var personListView = new PersonListView();
});
