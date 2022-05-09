var inheritancesList = {};

/**
 * set hierarchy type on relation according to the selected type in the combo box
 * @param link
 */
function change_link_hierarchy_type(link) {
    try {
        var myselect = document.getElementById("hierarchy-type");
        link._hierType = myselect.options[myselect.selectedIndex].value;
        var superEntity = link._target;
        
        for (var i = 0; i < conceptual_links_list.length; i++) {
            var l = conceptual_links_list[i];
            // search other parenting relations of the same super entity and change
            if (l._target.id == superEntity.id && l._order == "parenting") {
                l._hierType = myselect.options[myselect.selectedIndex].value;
                l._label = myselect.options[myselect.selectedIndex].value;
                l._link.label(0, {
                    attrs: {
                        text: {
                            text: l._label
                        }
                    }
                });
                link._link.label(0, {
                    attrs: {
                        text: {
                            text: l._label
                        }
                    }
                });
            }
            // change the hierType of pareting links to other super Entities (herança múltipla)
            if (l._source.id == link._source.id && l._order == "parenting") {
                l._hierType = myselect.options[myselect.selectedIndex].value;
                l._label = myselect.options[myselect.selectedIndex].value;
                l._link.label(0, {
                    attrs: {
                        text: {
                            text: l._label
                        }
                    }
                });
                link._link.label(0, {
                    attrs: {
                        text: {
                            text: l._label
                        }
                    }
                });
            }
        }
        LogStatus("Changed inheritance type to " + link._hierType);
    } catch (err) {
        call_error_dialog(err, "change link hierarchy type");
    }
}

/**
 *
 * @param current_link
 * @returns {string}
 */
function hierarchy_properties_html(current_link) {
	try{
		var content = '<label>Inheritance Type</label>';

	    content += '<select onchange="change_link_hierarchy_type(current_link);" id="hierarchy-type" style="width: 100px; margin-left: 25px">' +
					'<option value="single">Single</option>' +
					'<option value="concrete">Concrete</option>' +
					'<option value="complete">Complete</option>' +
					'</select>';

	    return content;
	} catch(err) {
		call_error_dialog(err,"hierarchy properties html");
	}
}

/**
 * Get inheritance type from super entity
 * @param superEntity
 * @returns {*}
 */
function get_inheritance_type(superEntity) {
    try {
        for (var i = 0; i < conceptual_links_list.length; i++) {
            var link = conceptual_links_list[i];
            // super tabela já tem uma relação de herança
            if (link._target.id == superEntity.shape.id && link._order == "parenting") {
                return link._hierType;
            }
        }
        // retornar tipo de herança por omissão
        return HIER_TYPE.COMPLETE;
    } catch (err) {
        call_error_dialog(err, "get inheritance type");
    }
}

/**
 * Function to check cycles in inheritance relations
 * @returns {boolean}
 */
function check_parenting_restrictions() {
    try {
        var nextToVisit = [];
        var alreadyVisited = Array.apply(null, Array(conceptual_tables_list.length)).map(Number.prototype.valueOf, 0);
        
        nextToVisit.push(new_relation["source"].shape.id);
        nextToVisit.push(new_relation["target"].shape.id);
        
        while (nextToVisit.length != 0) {
            // Get next table to visit
            var nextId = nextToVisit.shift();
            // Find table index
            var tableIndex;
            for (var i = 0; i < conceptual_tables_list.length; i++) {
                if (conceptual_tables_list[i].shape.id == nextId) {
                    tableIndex = i;
                    break;
                }
            }
            // Get other inheritance relations and add them to the nextToVisit array
            for (var i = 0; i < conceptual_links_list.length; i++) {
                if (conceptual_links_list[i]._source.id == nextId && conceptual_links_list[i]._order == "parenting") {
                    nextToVisit.push(conceptual_links_list[i]._target.id);
                    //console.log("Id,for:" + conceptual_links_list[i]._target.id);
                }
            }
            // Check if first time visited
            if (alreadyVisited[tableIndex] == 0) {
                alreadyVisited[tableIndex] = 1;
            } else {
                // If false then return error
                return false;
            }
        }
        return true;
    } catch (err) {
        call_error_dialog(err, "check parenting restrictions");
    }
}

/**
 * Function to check if an entity already have an inheritance relation
 * @returns {boolean}
 */
function entity_has_parent_relation(entity) {
    for (var l = 0; l < conceptual_links_list.length; l++) {
        var link = conceptual_links_list[l];
        if (link._order == "parenting" && link._source.id == entity.shape.id) {
            return true;
        }
    }
    return false;
}

/**
 * Function to generate warnings if entities that inherit from others have primary keys defined (since they will inherite the parent's keys)
 */
function warning_inheritance_pk()
{
    try {
        var warning = "Warning: ";
        var tables = [];
        for (var i = 0; i < conceptual_links_list.length; i++) {
            var link = conceptual_links_list[i];
            if (link._order == "parenting") {
                var table = getTableWithID(link._source.id);
                if (table_has_pk(table)) {
                    tables.push(table.data.table_name);
                }
            }
        }
        var t = [];
        $.each(tables, function(i, el) {
            if ($.inArray(el, t) === -1) t.push(el);
        });
        // no warning related to pk in weak entities to show
        if (t.length == 0) {
            return;
        }
        // only one table with problem, warning message is slightly different
        if (t.length == 1) {
            LogStatus(warning += t[0] + " entity is inherited and should not have primary key. Note that it will not be used in the physical diagram.", true);
            return;
        }
        for (var i = 0; i < t.length; i++) {
            if ((i + 1) == t.length) {
                warning = warning.slice(0, -1);
                warning += " and " + t[i];
            } else {
                warning += t[i] + ","
            }
        }
        warning += " entities are inherited and should not have primary key. Note that it will not be used in the physical diagram.";
        LogStatus(warning, true);
    } catch (err) {
        call_error_dialog(err, "warning inheritance pk");
    }
}

/**
 * Used to count the total number of inheritance relations left (i.e. yet to be handle)
 * @returns {number} Number of remaining inheritance relations
 */
function countInheritanceRelations() {
    var countRelations = 0;
    for (var i = 0; i < physical_links_list.length; i++) {
        if (physical_links_list[i]._order == "Physical-parenting") {
            countRelations++;
        }
    }
    return countRelations;
}