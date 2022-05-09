/* WEAK ENTITIES SVG */
var weakEntity_svg_0N = 'M 0 0 L 20 0 M 0 5 L 20 5 M 0 -5 L 20 -5 M40 0 L20 -10 L20 10 Z M 44 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0';
var weakEntity_svg_1N = 'M 0 0 L 20 0 M 0 5 L 20 5 M 0 -5 L 20 -5 M40 0 L20 -10 L20 10 Z M 40 0 L 40 -10 L 40 10';
var weakEntity_svg_11 = 'M 0 0 L 20 0 M40 0 L20 -10 L20 10 Z M 40 0 L 40 -10 L 40 10 M 40 0 L 50 0';
var weakEntity_svg_01 = 'M 0 0 L 20 0 M40 0 L20 -10 L20 10 Z M 44 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0';

/* WEAK ENTITIES ARRAY */
var weak_entities = {};
var strong_entities = [];
var weak_entities_copy = {};

/**
 * Called when generating the physical diagram for handling the weak entities
 * @param tables_match
 */
function handle_weak_entities(tables_match)
{
	try{
		var entity;
		weak_entities_copy = $.extend(true, {}, weak_entities);

		// while there are strong entities
		while ( strong_entities.length > 0 ) {
			// returns last entity of the array
			entity = strong_entities.pop(); 

			update_PK_weak_entities(entity,tables_match);
		}
	} catch(err) {
    	call_error_dialog(err,"handle weak entities");
  	}
}

/**
 * Returns 'true' if weak parameter is a table that is weak to the table passed as the strong parameter 'false' otherwise
 * @param weak
 * @param strong
 * @param conceptual
 * @returns {boolean}
 */
function table_is_weak_to(weak, strong, conceptual, physical)
{
    try {
        var strongID = strong.shape.id;
        var weakID = weak.shape.id;
        var links_list = conceptual_links_list_copy;

        if (conceptual === undefined) {
            conceptual = false;
        }

        if (physical === undefined) {
            physical = false;
        }

        if (conceptual) {
            links_list = conceptual_links_list;
        }

        if (physical) {
            links_list = physical_links_list;
        }

        for (var i = 0; i < links_list.length; i++) {
            link = links_list[i];
            if (link._target.id == strongID && link._sourceisweak && link._source.id == weakID) {
                return true;
            } else if (link._source.id == strongID && link._targetisweak && link._target.id == weakID) {
                return true;
            }
        }
        
        return false;

    } catch (err) {
        call_error_dialog(err, "table is weak to");
    }
}

/**
 * Update the primary keys of the weak entities of the strong entity passed as parameter
 * @param strongEntity
 * @param tables_match
 */
function update_PK_weak_entities(strongEntity, tables_match)
{
    try {
        var has_weak = false;
        var conceptual_weak, weakEntity, link, strongID = tables_match[strongEntity.shape.id];
        var physical_strong = getPhysicalTableWithID(strongID.id);
        
        // find weak entities for this strong entity and update the primary keys
        for (var i = 0; i < conceptual_links_list_copy.length; i++) {
            link = conceptual_links_list_copy[i];
            if (link._target == strongID && link._sourceisweak) {
                weakEntity = getPhysicalTableWithID(link._source.id);
            } else if (link._source == strongID && link._targetisweak) {
                weakEntity = getPhysicalTableWithID(link._target.id);
            } else {
                continue;
            }

            has_weak = true;
            
            // needed because the ids stored in weak_entities correspond to the conceptual ids
            conceptual_weak = get_conceptual_table_from_physical_id(weakEntity.shape.id, tables_match);
            
            // Verify if is needed to change the PK or not
            var changePK = need_to_change_PK_in_weak(conceptual_weak.shape.id);
            
            for (var f = 0; changePK && f < weakEntity.data.fields.length; f++) {
                if (weakEntity.data.fields[f].isPK) {
                    weakEntity.data.fields[f].isPK = false;
                    weakEntity.data.fields[f].isUnique = true;
                    weakEntity.data.fields[f].isNotNull = true;
                }
            }
            
            // update primary keys of weak with the pk of the strong entity (except in 1:1 cases)
            if (!(link._sourceCard == "1:1" && link._targetCard == "1:1")) {
                get_pk_as_fk(physical_strong, weakEntity, true, false, false);
            }
            
            // is not weak for any other, it became strong!
            if (--weak_entities_copy[conceptual_weak.shape.id] == 0) {
            	strong_entities.push(conceptual_weak);
            }
        }

        if (!has_weak) {
            return;
        }

        // mark the PK of the strong entity has used so they don't repeat when dealing with normal relations stuff
        update_PK_status(physical_strong);
    } catch (err) {
        call_error_dialog(err, "update primary keys weak entities");
    }
}

function need_to_change_PK_in_weak(conceptualTableID)
{
    for (var bug = 0; bug < conceptual_links_list.length; bug++) {
        if (conceptual_links_list[bug]._source.id == conceptualTableID) {
            if (conceptual_links_list[bug]._sourceisweak == true) {
                if ((conceptual_links_list[bug]._sourceCard == "0:1") ||
                	(conceptual_links_list[bug]._sourceCard == "1:1")) {
                    return true;
                }
            }
        } else if (conceptual_links_list[bug]._target.id == conceptualTableID) {
            if (conceptual_links_list[bug]._targetisweak == true) {
                if ((conceptual_links_list[bug]._targetCard == "0:1") ||
                	(conceptual_links_list[bug]._targetCard == "1:1")) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Update primary key status from strong entity
 * @param strongEntity
 */
function update_PK_status(strongEntity)
{
    try {
        for (var i = 0; i < strongEntity.data.fields.length; i++) {
            if (strongEntity.data.fields[i].isPK && strongEntity.data.fields[i].used == false) {
                strongEntity.data.fields[i].used = true;
            }
        }
    } catch (err) {
        call_error_dialog(err, "update primary key status");
    }
}

/**
 * Find which entities from the conceptual diagram are strong
 */
function set_strong_entities()
{
    try {
        strong_entities = [];
        for (var i = 0; i < conceptual_tables_list.length; i++) {
            if (!(conceptual_tables_list[i].shape.id in weak_entities) && 
            	!conceptual_tables_list[i].data.sequence) {
                strong_entities.push(conceptual_tables_list[i]);
            }
        }
    } catch (err) {
        call_error_dialog(err, "set strong entities");
    }
}

/**
 * Update weak entites when other is deleted
 * @param weakEntity
 */
function update_weak_entities_after_delete(weakEntity)
{
    try {

        if (!weak_entities[weakEntity.shape.id]) {
            return;
        }

        if (--weak_entities[weakEntity.shape.id] == 0) {
            delete weak_entities[weakEntity.shape.id];
        }
    } catch (err) {
        call_error_dialog(err, "update weak entities after delete");
    }
}

/**
 * Update weak entities after add other entity
 * @param weakEntity
 */
function update_weak_entities_after_new(weakEntity)
{
    try {
        if (weakEntity.shape.id in weak_entities) {
            weak_entities[weakEntity.shape.id]++;
        } else {
            weak_entities[weakEntity.shape.id] = 1;
        }
    } catch (err) {
        call_error_dialog(err, "update weak entities after new");
    }
}

/**
 * Function to check cycles in weak relations
 * @returns {boolean}
 */
function check_weak_entities_cycles(weakEntity, strongEntity, physical)
{
    try {
        var tables = conceptual_tables_list;

        if (physical) {
            tables = physical_tables_list;
        } else {
            physical = false;
        }

        var nextToVisit = [];
        var alreadyVisited = Array.apply(null, Array(tables.length)).map(Number.prototype.valueOf, 0);

        nextToVisit.push(weakEntity);
        nextToVisit.push(strongEntity);

        while (nextToVisit.length != 0) {
            // Get next table to visit
            var nextId = nextToVisit.shift();
            // Find table index
            var tableIndex;
            for (var i = 0; i < tables.length; i++) {
                if (tables[i].shape.id == nextId.shape.id) {
                    tableIndex = i;
                    break;
                }
            }
            // Get other relations and add them to the nextToVisit array
            for (var i = 0; i < tables.length; i++) {
                if (nextId.shape.id != weakEntity.shape.id && 
                	table_is_weak_to(nextId, tables[i], !physical, physical)) {
                    nextToVisit.push(tables[i]);
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
        call_error_dialog(err, "check weak entity cycles");
    }
}

/**
 * The status of a dependency relation was changed
 * @param link
 * @param source
 */
function change_weak_status(link, source)
{
    try {
        var weakEntity, strongEntity, weakElement, strongElement, weakCard;

        // define variables
        if (source) {
            weakEntity = getTableWithID(link._source.id);
            strongEntity = getTableWithID(link._target.id);
            weakElement = $("#source_is_weak");
            strongElement = $("#target_is_weak");
            weakCard = link._sourceCard;
        } else {
            weakEntity = getTableWithID(link._target.id);
            strongEntity = getTableWithID(link._source.id);
            weakElement = $("#target_is_weak");
            strongElement = $("#source_is_weak");
            weakCard = link._targetCard;
        }

        // Entity was checked as weak
        if (weakElement.prop("checked")) {
            if (weakEntity.shape.id == strongEntity.shape.id) { // recursive relations cannot be weak
                LogStatus("Error: An entity cannot be weak to itself", true);
                weakElement.prop("checked", false);
                return;
            }

            // only one entity of a relation can be weak at a time
            else if (strongElement.prop("checked")) {
                strongElement.prop('checked', false);
                change_weak_status(link, !source);
                if (!check_weak_entities_cycles(weakEntity, strongEntity)) { // this is will create a cycle with weak entities, cannot happen!
                    LogStatus("Error: Detected cycle of weak entities", true);
                    strongElement.prop('checked', true);
                    change_weak_status(link, !source);
                    weakElement.prop("checked", false);
                    return;
                }
            } else if (!check_weak_entities_cycles(weakEntity, strongEntity)) { // this is will create a cycle with weak entities, cannot happen!
                LogStatus("Error: Detected cycle of weak entities", true);
                weakElement.prop("checked", false);
                return;
            }

            // add entity to the weak entities array
            // if already there, update the count of strong entities of that weak entity
            update_weak_entities_after_new(weakEntity);
            
            if (source) {
                link._targetCard = "1:1";
                link._sourceisweak = true;
                link._targetisweak = false;
                // cardinality of strong must be 1:1
                // and it can be altered
                $('#properties-link-type-target').val("1:1");
                document.getElementById('properties-link-type-target').disabled = true;
            } else {
                link._sourceCard = "1:1";
                link._sourceisweak = false;
                link._targetisweak = true;
                $('#properties-link-type-source').val("1:1");
                document.getElementById('properties-link-type-source').disabled = true;
            }
            
            set_link_cardinality(!source, "1:1", link, false);
            // cardinality of the weak is the same
            set_link_cardinality(source, weakCard, link, true);
            LogStatus("A new weak entity was created");
        }
        // Entity was weak but now was unchecked
        else {
            uncheck_entity_as_weak(link, source, weakEntity, weakCard);
            LogStatus("A previous weak entity is no longer weak");
        }
    } catch (err) {
        call_error_dialog(err, "change weak status");
    }
}

/**
 * Uncheck entity as weak
 * @param link
 * @param source
 * @param weakEntity
 * @param card
 */
function uncheck_entity_as_weak(link, source, weakEntity, card)
{
    try {
        if (source) {
            link._sourceisweak = false;
            document.getElementById('properties-link-type-target').disabled = false;
        } else {
            link._targetisweak = false;
            document.getElementById('properties-link-type-source').disabled = false;
        }

        // cardinality remains the same
        set_link_cardinality(source, card, link, false);
        
        // update the weak entities array
        update_weak_entities_after_delete(weakEntity);
    } catch (err) {
        call_error_dialog(err, "uncheck entity as weak");
    }
}

/**
 * Update the shape of a link after changes
 * @param source
 * @param type
 * @param link
 * @param weak
 */
function set_link_cardinality(source, type, link, weak)
{
    var side;
    source == true ? side = "source" : side = "target";
    
    try {
        if (type == "1:1") {
            if (weak) {
                link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: weakEntity_svg_11
                });
            } else {
                link._link.attr('.marker-' + side, {
                    fill: "transparent",
                    d: "M 0 0 L 25 0 M 25 0 L 25 10 M 25 0 L 25 -10 M 10 0 L 10 10 M 10 0 L 10 -10"
                });
            }
        } else if (type == "1:n") {
            if (weak) {
                link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: weakEntity_svg_1N
                });
            } else {
                link._link.attr('.marker-' + side, {
                    fill: "transparent",
                    d: "M 0 0 L 25 0 M 25 0 L 0 10 M 25 0 L 0 -10 M 25 10 L 25 -10"
                });
            }
        } else if (type == "0:n") {
            if (weak) {
                link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: weakEntity_svg_0N
                });
            } else {
                link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: "M 0 0 L 16 0 M 16 0 L 0 10 M 16 0 L 0 -10 M 20 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0"
                });
            }
        } else if (type == "0:1") {
            if (weak) {
                link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: weakEntity_svg_01
                });
            } else {
                link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: "M 0 0 L 16 0 M 10 10 L 10 -10 M 20 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0"
                });
            }
        }
        
        LogStatus("Updated Link Type");
    } catch (err) {
        Raven.captureException("set link cardinality");
    }
}

/**
 * Create the weak entities array from conceptual links (used when a file was open, for example)
 * @param links
 */
function set_weak_entities(links)
{
    try {
        for (var i = 0; i < links.length; i++) {
            if (links[i]._sourceisweak) {
                update_weak_entities_after_new(getTableWithID(links[i]._source.id))
            } else if (links[i]._targetisweak) {
                update_weak_entities_after_new(getTableWithID(links[i]._target.id));
            }
        }
    } catch (err) {
        call_error_dialog(err, "set weak entities");
    }
}

function warning_weak_entities_pk()
{
    try {
        var warning = "Warning: ";
        var tables = [];
        
        for (var i = 0; i < conceptual_links_list.length; i++) {
            var link = conceptual_links_list[i];
            if (link._order == "normal" && link._sourceisweak && need_to_change_PK_in_weak(link._source.id)) {
                var table = getTableWithID(link._source.id);
                if (table_has_pk(table)) {
                	tables.push(table.data.table_name);
                }
            }
            if (link._order == "normal" && link._targetisweak && need_to_change_PK_in_weak(link._target.id)) {
                var table = getTableWithID(link._target.id);
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
        if (t.length == 0) return;
        
        // only one table with problem, warning message is slightly different
        if (t.length == 1) {
            LogStatus(warning += t[0] + " entity is dependent and should not have primary key. Note that it will not be used in the physical diagram.", true);
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
        
        warning += " entities are dependent and should not have primary key. Note that it will not be used in the physical diagram.";
        LogStatus(warning, true);
    } catch (err) {
        call_error_dialog(err, "warning inheritance pk");
    }
}
