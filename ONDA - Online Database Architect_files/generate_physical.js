var physical_tables_list = [];
var physical_links_list = [];
var connections_source_list = [];
var connections_target_list = [];
var sequences_tables = [];
var conceptual_links_list_copy;
var tables_match = [];

/**
 * General function for generating the physical diagram.
 * It sets up all the necessary variables and calls the needed functions to create the physical diagram.
 *
 * @param view
 */
function generate_physical_diagram(view) {
    try {
        physical_tables_list = [];
        physical_links_list = [];
        sequences_tables = [];
        connections_source_list = [];
        connections_target_list = [];
        var pt;
        // conceptual_tables é uma array de tabelas SQL, que contém o nome e os campos
        // conceptual_links é um array de relacionamentos SQL_Link
        for (var i = conceptual_tables_list.length - 1; i >= 0; --i) {
            /* create physical tables according to the conceptual tables
             (same name, same position. FK are added to the table, along with Not Null and Unique notations)
             */
            // sequences are not featured in the physical diagram
            if (conceptual_tables_list[i].data.sequence) {
                sequences_tables.push(conceptual_tables_list[i]);
            } else {
                pt = copy_table(conceptual_tables_list[i]);
                physical_tables_list.push(pt);
                tables_match[conceptual_tables_list[i].shape.id] = pt.shape;
            }
        }
        physical_tables_list.reverse();
        conceptual_links_list_copy = [];
        
        /* copy the relationships in the conceptual tables
         to the physical tables */
        for (var i = conceptual_links_list.length - 1; i >= 0; --i) {
            var link = conceptual_links_list[i];
            var l = new SQL_Link(
                    tables_match[link._source.id],
                    tables_match[link._target.id],
                    link._order,
                    link._hierType,
                    link._sourceCard,
                    link._targetCard,
                    link._isSoft,
                    null,
                    link._label,
                    link._sourceisweak,
                    link._targetisweak
                );
            conceptual_links_list_copy.push(l);
        }
        
        // Handle Weak Entities (if there are any)
        if (Object.keys(weak_entities).length > 0) {
            handle_weak_entities(tables_match);
        }
        
        // Add 1 to 1 links
        var noLinks = conceptual_links_list_copy.length;
        for (var i = 0; i < noLinks; i++) {
            /* Add 1:1 links first (Because they are combined in a single table in the physical diagram??) */
            if (conceptual_links_list_copy[i]._sourceCard == "1:1" && 
                conceptual_links_list_copy[i]._targetCard == "1:1") {
                //add_link(conceptual_links_list_copy[i]);
                add_link_11_11(conceptual_links_list_copy[i]);
            }
        }
		
		  /* there are probably tables that were deleted because they were not needed (like the 1:1 case)?? */
        for (var i = physical_tables_list.length - 1; i >= 0; --i) {
            if (physical_tables_list[i].shape == null) {
                physical_tables_list.splice(i, 1);
                /* remove the table from the list */
            }
        }

		
		
		/*for (var i = 0; i < conceptual_links_list.length; i++) {
			 if (conceptual_links_list[i]._order == "parenting"  && conceptual_links_list[i]._hierType!="complete") {
				var t = get_target(tables_match[conceptual_links_list[i]._target.id].id);
				var t2 = get_target( tables_match[conceptual_links_list[i]._source.id].id);
				
				console.log("tttttt"+t);
				console.log("t2tttt"+t2);
				console.log("innnnnn"+i);
				console.log("lennnnnn"+connections_target_list.length);
					var k = search_physical_table(connections_target_list[i*2][0]);
					var k2 = search_physical_table(connections_target_list[i*2+1][0]);
					var tf = physical_tables_list[k].data.fields;
					var sf = physical_tables_list[k2].data.fields;
					for (var j = 0; j < tf.length; ++j) {
						if (tf[j].isPK === true) {
							sf.push(copy_field(tf[j]));
							/*sf[sf.length - 1].isPK = true;
							sf[sf.length - 1].fieldName = physical_tables_list[k].data.table_name + "_" + tf[j].fieldName;
							/*sf[sf.length - 1].FKTable = physical_tables_list[k].data.table_name;
							sf[sf.length - 1].FKField = tf[j].fieldName;
						}
					}
				
			 }
		 }
		*/
        
        /* Add other links */
        for (var i = 0; i < noLinks; i++) {
            if (conceptual_links_list_copy[i]._order == "normal") {
                if (conceptual_links_list_copy[i]._sourceCard != "1:1" || 
                    conceptual_links_list_copy[i]._targetCard != "1:1") {
                    add_link(conceptual_links_list_copy[i]);
                }
            }
        }
        
        /* Add inheritance relations single*/
        for (var i = 0; i < conceptual_links_list_copy.length; i++) {
            if (conceptual_links_list_copy[i]._order == "parenting") {
				
				console.log("++++++"+conceptual_links_list_copy[i]._hierType);
                add_link_parenting(conceptual_links_list_copy[i]);
            }
        }
		
		
		
		/* setting connections_source_list and connections_target_list variables
         connections_source_list becomes an array:
         -TableX
         -Links for which it is source

         connections_target_list becomes an array:
         -TableX
         -Links for which it is target
         */
		
        preprocessing();
	
        
	
       while (countInheritanceRelations() != 0) {
            add_hierarchies();
        }

		
		  /* there are probably tables that were deleted because they were not needed (like the 1:1 case)?? */
        for (var i = physical_tables_list.length - 1; i >= 0; --i) {
            if (physical_tables_list[i].shape == null) {
                physical_tables_list.splice(i, 1);
                /* remove the table from the list */
            }
        }
        
        /* this variable is probably setted in the add_link method */
        physical_links_list.reverse();
        
      
        
        /* correct tables names */
        correct_names();
        
        
        /* replace the links for others (maybe changing the type for drawing the black arrow, idk...) */
        for (var i = physical_links_list.length - 1; i >= 0; --i) {
            var link = physical_links_list[i];
            var li = createLink(
                link._source,
                link._target,
                link._order,
                link._hierType,
                link._sourceCard,
                link._targetCard,
                link._isSoft
            );
            var l = new SQL_Link(
                link._source,
                link._target,
                link._order,
                link._hierType,
                link._sourceCard,
                link._targetCard,
                link._isSoft,
                li,
                link._label,
                link._sourceisweak,
                link._targetisweak
            );
            l._visible = link._visible;
            physical_links_list.splice(i, 1, l);
        }
        /*for ( var i=0; i < physical_tables_list.length; i++){
        	for ( var j=0; j < physical_tables_list.length; j++) {
        		if ( i==j) continue;
        		if (table_is_weak_to(physical_tables_list[i], physical_tables_list[j], false, true)) {
        			//console.log(physical_tables_list[i]);
        			//console.log(physical_tables_list[j]);
        			if (!check_weak_entities_cycles(physical_tables_list[i], physical_tables_list[j], true)) {
        				LogStatus("Error: Detected cycle of weak entities", true);
        				current_diagram = view;
        				switch_view(0, true);
        				return;
        			}
        		}
        	}
        }*/
        /* actually draw the diagram */
        create_physical_graph();
    } catch (err) {
        call_error_dialog(err, "generate physical diagram");
    }
}

/*function get_physical_table_from_conceptual(table_c){
	for (var i=0; i<tables_match.length; i++){
		if(tables_match[i].id==table_c.id){
			
		}
			
	}
}*/

function parent_of(id_p){
	 try {
	console.log("lllllllllllll  "+id_p);
	var table_c=get_conceptual_table_from_physical_id(id_p,tables_match);
	var id_c=table_c.shape.id;
	var i;
	for (i=0; i<conceptual_links_list_copy.length; i++){
		if(conceptual_links_list_copy[i]._order == "parenting"){
			if(conceptual_links_list_copy[i]._source.id==id_p){
			
				return parent_of(conceptual_links_list_copy[i]._target.id);
			}
				
		}
	}
	for(i=0; i<physical_tables_list.length; i++){
		console.log(""+i+"ptlid "+physical_tables_list[i].shape.id);
		if(physical_tables_list[i].shape.id==id_p)
			return physical_tables_list[i];
	}
	} catch (err) {
        call_error_dialog(err, "parent_of");
    }
	
}

function get_fk_from_inheritance(id_p){
	var par=parent_of(id_p);
	
}

/**
 * Handles Table names.
 **/
function correct_names() {
    try {
        while (true) {
            var f_count = 0;
            for (var i = physical_tables_list.length - 1; i >= 0; --i) {
                var count = 0;
                for (var j = i - 1; j >= 0; --j) {
                    if (physical_tables_list[i].data.table_name == physical_tables_list[j].data.table_name) {
                        count++;
                    }
                }
                if (count !== 0) {
                    f_count++;
                    physical_tables_list[i].data.table_name = physical_tables_list[i].data.table_name + "_" + count;
                }
            }
            if (f_count === 0) {
                break;
            }
        }
        /* colocar nomes das tabelas e dos fields em letra minúscula
         * mudar nomes das tabelas bridge para tabela1_tabela2 */
        for (var i = physical_tables_list.length - 1; i >= 0; --i) {
            physical_tables_list[i].data.table_name = physical_tables_list[i].data.table_name.replace(/\s+/g, "_").toLowerCase();
            for (var j = 0; j < physical_tables_list[i].data.fields.length; ++j) {
                physical_tables_list[i].data.fields[j].fieldName = physical_tables_list[i].data.fields[j].fieldName.replace(/\s+/g, "_").toLowerCase();
            }
        }
        /* mudar nomes dos fields das tabelas de relacionamentos recursivos para field1, field2, etc */
        for (var i = physical_tables_list.length - 1; i >= 0; --i) {
            for (var j = 0; j < physical_tables_list[i].data.fields.length; ++j) {
                var c = 1;
                for (var k = 0; k < physical_tables_list[i].data.fields.length; ++k) {
                    if (j == k) {
                    	continue;
                    }
                    if (physical_tables_list[i].data.fields[j].fieldName == physical_tables_list[i].data.fields[k].fieldName) {
                        physical_tables_list[i].data.fields[k].fieldName += c;
                        c++;
                    }
                }
            }
        }
    } catch (err) {
        call_error_dialog(err, "correct names");
    }
}
/**
 * Prepares the necessary arrays before processing the physical diagram
 */
function preprocessing() {
    try {
        var tables = physical_tables_list;
        var links = physical_links_list;
		
		connections_source_list=[];
		connections_target_list=[];
        for (var i = 0; i < conceptual_links_list_copy.length*2; ++i) {
			if(tables[i]!=undefined){
				console.log(i+"="+tables[i].shape.id+""+tables[i].data.table_name);
            var cons_s = [tables[i].shape.id];
            var cons_t = [tables[i].shape.id];}
			else{
				var cons_s = [-10];
            var cons_t = [-10];
			}
            for (var j = 0; j < links.length; ++j) {
                if (links[j]._source.id == cons_s[0]) {
			
                    cons_s.push(links[j]);
                } else if (links[j]._target.id == cons_t[0]) {
                    cons_t.push(links[j]);
                }
            }
			//if(cons_t.length==2){
            connections_source_list.push(cons_s);
            connections_target_list.push(cons_t);
			//}
        }
    } catch (err) {
        call_error_dialog(err, "preprocessing");
    }
}
/**
 * Get parent table ID in inheritance relations.
 * @param p Table ID
 * @returns {*} Table ID
 esta funcao nao faz nada mas pronto
 */
function get_parent(p) {
    try {
        var sources = connections_source_list;
        for (var i = 0; i < sources.length; ++i) {
            if (sources[i][0] == p) {
                for (var j = 1; j < sources[i].length; ++j) {
                    if (sources[i][j]._order != "Physical") {
                        return get_parent(sources[i][j]._target.id);
                    }
                }
                break;
            }
        }
        return p;
    } catch (err) {
        call_error_dialog(err, "get parent");
    }
}
/**
 * Handles inheritance relations of SINGLE type
 * @param id Link ID
 */
function merge_single(id) {
    try {
        var t = get_target(id);
        var targets = connections_target_list;
        var sources = connections_source_list;

        for (var i = 1; i < targets[t].length; ++i) {
            // parenting relation
			
            if (targets[t][i]._order != "Physical" && targets[t][i]._hierType == HIER_TYPE.SINGLE) {
			
                merge_single(targets[t][i]._source.id);
                t = get_target(id);
                var t2 = get_target(targets[t][i]._source.id);
                var k = search_physical_table(targets[t][0]);
                var k2 = search_physical_table(targets[t2][0]);
                var table = physical_tables_list[k2];
                for (var j = 0; j < physical_tables_list[k2].data.fields.length; ++j) {
                    var field = physical_tables_list[k2].data.fields[j];
                    field.isPK = false;
                    field.fieldName = table.data.table_name + "_" + field.fieldName;
                    physical_tables_list[k].data.fields.push(copy_field(field));
                }
                // check constraint
                var check_name = false;
                for (var x = 0; x < table.data.checkName.length; x++) {
                    for (var j = 0; j < physical_tables_list[k].data.checkName.length; j++) {
                        if (physical_tables_list[k].data.checkName[j] === table.data.checkName[x]) check_name = true;
                        break;
                    }

                    if (check_name === false) {
                        var old_array_checkName = [];
                        var old_array_checkCondition = [];
                        old_array_checkName = physical_tables_list[k].data.checkName.concat(old_array_checkName);
                        old_array_checkCondition = physical_tables_list[k].data.checkCondition.concat(old_array_checkCondition);
                        old_array_checkName.push(table.data.checkName[x]);
                        old_array_checkCondition.push(table.data.checkCondition[x]);
                        physical_tables_list[k].data.checkName = old_array_checkName.slice();
                        physical_tables_list[k].data.checkCondition = old_array_checkCondition.slice();
                    } else {
                        check_name = false;
                    }
                }
                for (var j = 1; j < targets[t2].length; ++j) {
                    var link = targets[t2][j];
                    if (link == targets[t][i]) {
                    	continue;
                    }
                    link._target = physical_tables_list[k].shape;
                    targets[t].push(link);
                }

                for (var j = 1; j < sources[t2].length; ++j) {
                    var link = sources[t2][j];
                    if (link == targets[t][i]) {
                    	continue;
                    }
                    link._source = physical_tables_list[k].shape;
                    sources[t].push(link);
                }
                physical_links_list.splice(physical_links_list.indexOf(targets[t][i]), 1);
                targets[t].splice(i, 1);
                physical_tables_list.splice(k2, 1);
                targets.splice(t2, 1);
                sources.splice(t2, 1);
                t = get_target(id);
                --i;
            }
        }
    } catch (err) {
        call_error_dialog(err, "merge single");
    }
}
/**
 * Handles inheritance relations of CONCRETE type
 * @param id Link ID
 */
function merge_concrete(id) {
    try {
        var t = get_target(id);
        var targets = connections_target_list;
        var sources = connections_source_list;
		var got_fk=false;
		
        for (var i = 1; i < targets[t].length; ++i) {
            if (targets[t][i]._order != "Physical" && targets[t][i]._hierType == HIER_TYPE.CONCRETE) {
                // t2 is the index in the targets array of the table that inherits from the one that will be deleted
                var t2 = get_target(targets[t][i]._source.id);
                var k = search_physical_table(targets[t][0]);
                var k2 = search_physical_table(targets[t2][0]);
                // k2 is the index of the current table that inherits from t
                // k is the index of the table that will be deleted
                for (var f = 0; f < physical_tables_list[k2].data.fields.length; f++) {
                    var field = physical_tables_list[k2].data.fields[f];
                    if (field.isPK)field.isPK = false;
                }
                var noFields = physical_tables_list[k2].data.fields.length;
                for (var j = 0; j < physical_tables_list[k].data.fields.length; ++j, noFields++) {
                    physical_tables_list[k2].data.fields.push(copy_field(physical_tables_list[k].data.fields[j]));
                    physical_tables_list[k2].data.fields[noFields].fieldName = physical_tables_list[k].data.table_name + "_" + physical_tables_list[k2].data.fields[noFields].fieldName; /*esta linha gera erros nos nomes*/
					
                    /*for(var nm=0;nm<noFields-1;nm++){
                    	if(physical_tables_list[k2].data.fields[noFields-1].fieldName == physical_tables_list[k2].data.fields[nm].fieldName){
                    		console.log(physical_tables_list[k2].data.fields[noFields-1].fieldName);
                    		console.log(physical_tables_list[k2].data.fields[nm].fieldName);
                    		physical_tables_list[k2].data.fields[noFields-1].fieldName = physical_tables_list[k].data.table_name + "_" + physical_tables_list[k2].data.fields[noFields-1].fieldName;
                    	}
                    }*/
                }
                // check constraint
                var check_name = false;
                for (var x = 0; x < physical_tables_list[k].data.checkName.length; x++) {
                    for (var j = 0; j < physical_tables_list[k2].data.checkName.length; j++) {
                        if (physical_tables_list[k2].data.checkName[j] === physical_tables_list[k].data.checkName[x]) check_name = true;
                        break;
                    }
                    if (check_name === false) {
                        var old_array_checkName = [];
                        var old_array_checkCondition = [];
                        old_array_checkName = physical_tables_list[k2].data.checkName.concat(old_array_checkName);
                        old_array_checkCondition = physical_tables_list[k2].data.checkCondition.concat(old_array_checkCondition);
                        old_array_checkName.push(physical_tables_list[k].data.checkName[x]);
                        old_array_checkCondition.push(physical_tables_list[k].data.checkCondition[x]);
                        physical_tables_list[k2].data.checkName = old_array_checkName.slice();
                        physical_tables_list[k2].data.checkCondition = old_array_checkCondition.slice();
                    } else {
                        check_name = false;
                    }
                }
				
				/* for (var x = 0; x < physical_tables_list[k2].data.fields.length; x++){
					 if(physical_tables_list[k2].data.fields[x].isPK){
						 if(find_complete(physical_tables_list[k])!=null){
							 physical_tables_list[k2].data.fields[x].isFK=true;
							 
						 }
					 }
				 }*/
				
                for (var j = 1; j < targets[t].length; ++j) {
                    var link = targets[t][j];
                    if (link._order != "Physical") {
                    	continue;
                    }
                    var li = createLink(link._source, physical_tables_list[k2].shape, link._order, "", "", "", link._isSoft);
                    var l = new SQL_Link(link._source, physical_tables_list[k2].shape, link._order, link._hierType, link._sourceCard, link._targetCard, link._isSoft, li, link._label);
                    targets[t2].push(l);
                    physical_links_list.push(l);
                }
                for (var j = 1; j < sources[t].length; ++j) {
                    var link = sources[t][j];
                    if (link._order != "Physical") {
                    	continue;
                    }
                    var li = createLink(physical_tables_list[k2].shape, link._target, link._order, "", "", "", link._isSoft);
                    var l = new SQL_Link(physical_tables_list[k2].shape, link._target, link._order, link._hierType, link._sourceCard, link._targetCard, link._isSoft, li, link._label);
                    sources[t2].push(l);
                    physical_links_list.push(l);
                }
                physical_links_list.splice(physical_links_list.indexOf(targets[t][i]), 1);
                sources[t2].splice(sources[t2].indexOf(targets[t][i]), 1);
                targets[t].splice(i, 1);
                //merge_concrete(targets[t2][0]);
                --i;
            }
        }
    } catch (err) {
        call_error_dialog(err, "merge concrete");
    }
}
/**
 * Handles inheritance relations of COMPLETE type
 * @param id Link ID
 */
function merge_all(id) {
    try {
        var t = get_target(id);
        var targets = connections_target_list;
        var sources = connections_source_list;

        for (var i = 1; i < targets[t].length; ++i) {
            if (targets[t][i]._order != "Physical" && targets[t][i]._hierType == HIER_TYPE.COMPLETE) {
                var t2 = get_target(targets[t][i]._source.id); // outra tabela da relação
                var k = search_physical_table(targets[t][0]);
                var k2 = search_physical_table(targets[t2][0]);
                var li = createLink(physical_tables_list[k2].shape, physical_tables_list[k].shape, "Physical", "", "", "");
                var l = new SQL_Link(physical_tables_list[k2].shape, physical_tables_list[k].shape, "Physical", "", "", "", false, li, targets[t][i]._label);
                var tf = physical_tables_list[k].data.fields;
                var sf = physical_tables_list[k2].data.fields;
                for (var j = 0; j < sf.length; j++) {
                    if (sf[j].isPK) {
                    	sf[j].isPK = false;
                    }
                }
                for (var j = 0; j < tf.length; ++j) {
                    if (tf[j].isPK === true) {
                        sf.push(copy_field(tf[j]));
                        sf[sf.length - 1].isFK = true;
                        sf[sf.length - 1].fieldName = physical_tables_list[k].data.table_name + "_" + tf[j].fieldName;
                        sf[sf.length - 1].FKTable = physical_tables_list[k].data.table_name;
                        sf[sf.length - 1].FKField = tf[j].fieldName;
						sf[sf.length - 1].isAutoIncrement = false;
                    }
                }
                physical_links_list.push(l);
                targets[t].push(l);
                sources[t2].push(l);
                physical_links_list.splice(physical_links_list.indexOf(targets[t][i]), 1);
                sources[t2].splice(sources[t2].indexOf(targets[t][i]), 1);
                targets[t].splice(i, 1);
               /* merge_all(targets[t2][0]);
                /*--i;*/
            }
        }
    } catch (err) {
        call_error_dialog(err, "merge all");
    }
}
/**
 * Gets the Table name.
 * @param p Physical Table ID
 * @returns {*} Returns Table name (or the ID if not found)
 */
function getName(p) {
    var sources = physical_tables_list;
    for (var i = 0; i < sources.length; ++i) {
        if (sources[i].shape.id == p) {
            return sources[i].data.table_name;
        }
    }
    return p;
}
/**
 * Handles inheritance relations: it handles the relation for ONLY the parent entity and its childs.
 * Call again to handle the remaining relations (if any).
 */
function add_hierarchies() {
    try {
        var targets = connections_target_list;
        var sources = connections_source_list;
        var links = physical_links_list;
		
        for (var i = 0; i < physical_links_list.length; i++) {
		
            if (links[i]._order == "Physical-parenting") {
                /* ir buscar a tabela de onde herda */
		
                var p = get_parent(links[i]._target.id);
				console.log("parent"+p+" id"+get_target(p));
				
                var skipAhead = false;
				
                for (var j = 0; j < links.length; j++) {
					
                    if (links[i]._target.id === links[j]._source.id && links[j]._order == "Physical-parenting") {
                        skipAhead = true;
                        break;
                    }
                }
                if (skipAhead) {
                	continue;
                }
                /*if(links[i] === undefined){
                	continue;
                }*/
                /* single hierarchy - the entities are joined into a single one */
                if (links[i]._hierType == HIER_TYPE.SINGLE) {
					
                    //console.log("Dealing single link with " + getName(links[i]._source.id) + " ----> " + getName(p));
                    merge_single(p);
				
                    var t = search_physical_table(p);
					console.log("kkkk"+links._hierType);
                    //var f = new PH_SQL_Field ("objectType", 6, false, false, null, null, true, false, "0", false,[],false);
                    // Check Constraint
                    /*console.log("Valor de P: " + t);
                    console.log("P checkName length: " + t.data.checkName.length);
                    for(var x=0; x<targets[t].data.checkName.length; x++){
                    	f.data.checkName[f.data.checkName.length] = targets[t].data.checkName[x];
                    	f.data.checkCondition[f.data.checkCondition.length] = targets[t].data.checkCondition[x];
                    }*/
                    //physical_tables_list[t].data.fields.push(f);
                }
                /* concrete hierarchy */
                else if (links[i]._hierType == HIER_TYPE.CONCRETE) {
                    //console.log("Dealing concrete link with " + getName(links[i]._source.id) + " ----> " + getName(p));
                    merge_concrete(p);
                    // index of the target of the table to be deleted
                    var t = search_physical_table(p);
                    if (t != null) {
                        for (var j = 1; j < targets[t].length; j++) {
                            console.log("Update the targets of the table");
                            physical_links_list.splice(physical_links_list.indexOf(targets[t][j]), 1);
                            t2 = get_target(targets[t][j]._source.id);
                            sources[t2].splice(sources[t2].indexOf(targets[t][j]), 1);
                        }
                        for (var j = 1; j < sources[t].length; j++) {
                            console.log("Update the sources of the table");
                            physical_links_list.splice(physical_links_list.indexOf(sources[t][j]), 1);
                            t2 = get_target(sources[t][j]._target.id);
                            targets[t2].splice(targets[t2].indexOf(sources[t][j]), 1);
                        }
                        targets.splice(t, 1);
                        sources.splice(t, 1);
                    }
                    physical_tables_list.splice(t, 1);
                }
                /* complete hierarchy */
                else if (links[i]._hierType == HIER_TYPE.COMPLETE) {
                    //console.log("Dealing complete link with " + getName(links[i]._source.id) + " ----> " + getName(p));
                    merge_all(p);
                }
                /*--i;*/
            }
        }
    } catch (err) {
        call_error_dialog(err, "add hierarchies");
    }
}
/**
 * Get index from the connections_target_list of the target entity of the @id link ID.
 * @param id Link ID
 * @returns {*} Table index
 */
function get_target(id) {
    try {
        var targets = connections_target_list;
        for (var i = 0; i < targets.length; ++i) {
            if (targets[i][0] == id) {
                return i;
            }
        }
        return null;
    } catch (err) {
        call_error_dialog(err, "get target");
    }
}
/**
 * Finds a Table with a given ID. Returns null if not found
 * @param id Table ID
 * @returns {*} Return table or null.
 */
function getPhysicalTableWithID(id) {
    try {
        for (var i = physical_tables_list.length - 1; i >= 0; i--) {
            if (physical_tables_list[i].shape.id == id) {
                return physical_tables_list[i];
            }
        }
        return null;
    } catch (err) {
        call_error_dialog(err, "get physical table id");
    }
}
/**
 * Create the Physical graph (i.e. fills canvas with newly created physical graph)
 */
function create_physical_graph() {
    try {
        /* Adjust table position if overlapping */
        for (i = 0; i < physical_tables_list.length; i++) {
            for (var j = i + 1; j < physical_tables_list.length; j++) {
                var t1 = physical_tables_list[i].shape;
                var t2 = physical_tables_list[j].shape;
                //TODO Detect overlapping not only by comparing the top left corner of each shape
                //TODO Detect if the solution overlaps with other shapes
                if ((t1.get('position').x == t2.get('position').x) && 
                	(t1.get('position').y == t2.get('position').y)) {
                	
                    var t1_pos = t1.get('position');
                    var t2_pos = t2.get('position');
                    var tableAdjustment = (t1.get('size').height + t2.get('size').height) / 4 + 75; // only vertical
                    t1_pos.y = t1_pos.y - tableAdjustment;
                    t2_pos.y = t2_pos.y + tableAdjustment;
                    t1.set('position', t1_pos);
                    t2.set('position', t2_pos);
                }
            }
        }
        /* draw tables in dashboard */
        for (var i = physical_tables_list.length - 1; i >= 0; --i) {
            update_table_graph(physical_tables_list[i], true);
            graph.addCell(physical_tables_list[i].shape);
        }
        /* Adjust link position if overlapping */
        for (i = 0; i < physical_links_list.length; i++) {
            for (var j = i + 1; j < physical_links_list.length; j++) {
                var link1 = physical_links_list[i]._link;
                var link2 = physical_links_list[j]._link;
                if ((link1.get('vertices')[0].x == link2.get('vertices')[0].x) && 
                	(link1.get('vertices')[0].y == link2.get('vertices')[0].y)) {

                    var l1_vet = link1.get('vertices');
                    var l2_vet = link2.get('vertices');
                    var linkAdjustment = 25;
                    l1_vet[0].x = l1_vet[0].x - linkAdjustment;
                    l1_vet[0].y = l1_vet[0].y - linkAdjustment;
                    l2_vet[0].x = l2_vet[0].x + linkAdjustment;
                    l2_vet[0].y = l2_vet[0].y + linkAdjustment;
                    link1.set('vertices', l1_vet);
                    link2.set('vertices', l2_vet);
                }
            }
        }
        for (i = physical_links_list.length - 1; i >= 0; --i) {
            if (!physical_links_list[i]._visible) {
            	continue;
            }
            var l = physical_links_list[i]._label;
            /* if name is too big, cut it */
            if (l.length > MAX_LINK_LABEL_CHARS) {
                l = l.substring(0, MAX_LINK_LABEL_CHARS - 1) + "..";
            }
            /* update the name in the relation (instead of "new relation") */
            physical_links_list[i]._link.label(0, {
                attrs: {
                    text: {
                        text: l
                    }
                }
            });
            /* draw relationships in dashboard */
            try {
                graph.addCell(physical_links_list[i]._link);
            } catch (err) {}
        }
        // update sequences tables because of the name
        for (var i = 0; i < sequences_tables.length; i++) {
            update_table_graph(sequences_tables[i], true);
        }
    } catch (err) {
        call_error_dialog(err, "create physical graph");
    }
}
/**
 * Search table index from physical_tables_list by ID
 * @param id Table ID
 * @returns {*} Table index (or null)
 */
function search_physical_table(id) {
    try {
        for (var i = physical_tables_list.length - 1; i >= 0; --i) {
            if (physical_tables_list[i].shape.id == id) {
                return i;
            }
        }
        return null;
    } catch (err) {
        call_error_dialog(err, "search physical table");
    }
}
// TODO Is this function equal to search_physical_table(id) ??
/**
 * Search table index from physical_tables_list by ID
 * @param id Table ID
 * @returns {*} Table index
 */
function search_table(id) {
    try {
        for (var i = physical_tables_list.length - 1; i >= 0; --i) {
            if (physical_tables_list[i].shape !== null && physical_tables_list[i].shape.id == id) {
                return i;
            }
        }
        return null;
    } catch (err) {
        call_error_dialog(err, "search table");
    }
}

function get_fk_field_name(id,name){
	for (var i=0; i<conceptual_links_list_copy.length; i++){
		if(conceptual_links_list_copy[i]._order == "parenting"  && conceptual_links_list_copy[i]._source.id==id){
			
			if(conceptual_links_list_copy[i]._hierType=="single"){
				return get_fk_field_name(conceptual_links_list_copy[i]._target.id,name);	
			}
			else{
				console.log("nfffffffffffff");
				for(var j=0; j<physical_tables_list.length; j++){
					if(physical_tables_list[j].shape.id==conceptual_links_list_copy[i]._target.id)
						return get_fk_field_name(conceptual_links_list_copy[i]._target.id, (name + physical_tables_list[j].data.table_name)+"_");	
				}
				
			}
		}
		
	}
	console.log("name "+name);
	return name;
}

function get_fk_provider(id){
	for (var i=0; i<conceptual_links_list_copy.length; i++){
		if(conceptual_links_list_copy[i]._order == "parenting"  && conceptual_links_list_copy[i]._hierType=="single"){
			if(conceptual_links_list_copy[i]._source.id==id){
				return get_fk_provider(conceptual_links_list_copy[i]._target.id);	
			}
		}
	}
	
	id=pass_concrete(id);
	
	for(i=0; i<physical_tables_list.length; i++){
		if(physical_tables_list[i].shape.id==id){
			
			return physical_tables_list[i];}
	}
}

function pass_concrete(id){
	for(var i=0;i<conceptual_links_list_copy.length; i++){
		if(conceptual_links_list_copy[i]._order == "parenting"  && conceptual_links_list_copy[i]._hierType=="concrete"){
			if(conceptual_links_list_copy[i]._target.id==id)
				return pass_concrete(conceptual_links_list_copy[i]._source.id);
		}
	}
	return id;
}

/* Add foreign table' PK as FK */
/**
 * Add Foreign key from another table.
 * @param from Origin Table
 * @param to Destination Table
 * @param PK Field data
 * @param NN Field data
 * @param UNI Field data
 */
function get_pk_as_fk(from, to, PK, NN, UNI) {
    try {		
		var fr=parent_of(from.shape.id);
		console.log("fr "+fr.data.table_name);
		console.log("to "+to.data.table_name);
        var fromf = fr.data.fields;
        var tof = to.data.fields;
        for (var i = 0; i < fromf.length; i++) {
			var fk_provider=get_fk_provider(from.shape.id);
			var t_name=fk_provider.data.table_name;
			var f_name=get_fk_field_name(fk_provider.shape.id,"");
            if (fromf[i].isPK === true) {
				
				if(table_is_weak_to(to, from)){
					for(var j=tof.length-1; j>-1; j--){
						if((tof[j].fieldName == (t_name + "_" + f_name + fromf[i].fieldName)) && (tof[tof.length - 1].FKTable == t_name))
							return;
					}
						
					}										
                if (fromf[i].used && table_is_weak_to(to, from)) {
                    return;
                }
                tof.push(copy_field(fromf[i]));
                tof[tof.length - 1].isPK = PK;
                tof[tof.length - 1].isNotNull = NN;
                tof[tof.length - 1].isUnique = UNI;
                tof[tof.length - 1].isFK = true;
                /* name the field like table_field FK ... */		
				tof[tof.length - 1].fieldName = t_name + "_" + f_name + fromf[i].fieldName;
                tof[tof.length - 1].FKTable = t_name;
                tof[tof.length - 1].FKField = f_name + fromf[i].fieldName;
				tof[tof.length - 1].isAutoIncrement = false;
            }
        }
    } catch (err) {
        call_error_dialog(err, "get primary key as foreign key");
    }
}
/**
 *
 * Converts a relation between two entities from the conceptual diagram to the physical diagram
 *
 * @param link
 */
function add_link(link) {
    // if (link._order == "normal" && link._sourceCard == "1:1" && link._targetCard == "1:1") {
    //     add_link_11_11(link);
    // } else
    if (link._order == "normal" && link._sourceCard == "0:1" && link._targetCard == "1:1") {
        add_link_01_11(link);
    } else if (link._order == "normal" && link._sourceCard == "1:1" && link._targetCard == "0:1") {
        add_link_11_01(link);
    } else if (link._order == "normal" && link._sourceCard == "0:1" && link._targetCard == "0:1") {
        add_link_01_01(link);
    } else if (link._order == "normal" && link._sourceCard == "1:1" && (link._targetCard == "1:n" || link._targetCard == "0:n")) {
        add_link_11_0n1n(link);
    } else if (link._order == "normal" && (link._sourceCard == "1:n" || link._sourceCard == "0:n") && link._targetCard == "1:1") {
        add_link_1n0n_11(link);
    } else if (link._order == "normal" && link._sourceCard == "0:1" && (link._targetCard == "1:n" || link._targetCard == "0:n")) {
        add_link_01_0n1n(link);
    } else if (link._order == "normal" && (link._sourceCard == "1:n" || link._sourceCard == "0:n") && link._targetCard == "0:1") {
        add_link_0n1n_01(link);
    } else if (link._order == "normal" && (link._sourceCard == "1:n" || link._sourceCard == "0:n") && (link._targetCard == "1:n" || link._targetCard == "0:n")) {
        add_link_0n1n_0n1n(link);
    }
    // else {
    // 	add_link_parenting(link);
    //}
}
/**
 * Link with inheritance relation
 * @param link
 */
function add_link_parenting(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
        var li = createLink(pst.shape, ptt.shape, "Physical-" + link._order, link._hierType, link._sourceCard, link._targetCard, link._isSoft);
        var l = new SQL_Link(pst.shape, ptt.shape, "Physical-" + link._order, link._hierType, link._sourceCard, link._targetCard, link._isSoft, li, link._label);
        physical_links_list.push(l);
    } catch (err) {
        call_error_dialog(err, "add link parenting");
    }
}
/**
 * Link with cardinality Zero or One to Zero or One
 * @param link
 */
function add_link_01_01(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
		console.log("pst: "+pst.shape.id);
		console.log("ptt: "+ptt.shape.id);
        if (standard == "true") {
            var positionS = pst.shape.get("position");
            var positionT = ptt.shape.get("position");
            var fields = [];
            var data = new SQL_Table_data(pst.data.table_name + "_" + ptt.data.table_name, fields);
            var physical_shape = createShape(((positionS.x + positionT.x) / 2), ((positionS.y + positionT.y) / 2), data.table_name, generate_fieldnames(data.fields, true), false, true);
            var t = new SQL_Table(null, physical_shape, data);
            if (pst.shape.id == ptt.shape.id) {
                get_pk_as_fk(pst, t, true, false, false);
                get_pk_as_fk(ptt, t, false, true, false);
            } else {
                get_pk_as_fk(pst, t, true, false, false);
                get_pk_as_fk(ptt, t, false, true, true);
            }
            physical_tables_list.push(t);
            var li1 = createLink(t.shape, ptt.shape, "Physical", "", "", "", link._isSoft);
            var li2 = createLink(t.shape, pst.shape, "Physical", "", "", "", link._isSoft);
            var l1 = new SQL_Link(t.shape, ptt.shape, "Physical", "", "", "", link._isSoft, li1, link._label, link._sourceisweak, link._targetisweak);
            var l2 = new SQL_Link(t.shape, pst.shape, "Physical", "", "", "", link._isSoft, li2, link._label, link._sourceisweak, link._targetisweak);
            physical_links_list.push(l1);
            physical_links_list.push(l2);
            if (pst.shape.id == ptt.shape.id) {
            	hide_link(l2);
            }
        } else {
            var li1 = createLink(pst.shape, ptt.shape, "Physical", "", "", "", link._isSoft);
            var l1 = new SQL_Link(pst.shape, ptt.shape, "Physical", "", "", "", link._isSoft, li1, link._label, link._sourceisweak, link._targetisweak);
            var li2 = createLink(ptt.shape, pst.shape, "Physical", "", "", "", link._isSoft);
            var l2 = new SQL_Link(ptt.shape, pst.shape, "Physical", "", "", "", link._isSoft, li2, link._label, link._sourceisweak, link._targetisweak);
            if (pst.shape.id == ptt.shape.id) {
                get_pk_as_fk(pst, ptt, false, false, true);
            } else {
                get_pk_as_fk(ptt, pst, false, false, false);
                get_pk_as_fk(pst, ptt, false, false, false);
            }
            physical_links_list.push(l1);
            physical_links_list.push(l2);
            if (pst.shape.id == ptt.shape.id) {
            	hide_link(l2);
            }
        }
    } catch (err) {
        call_error_dialog(err, "add link 01 -> 01");
    }
}
/**
 * Link with cardinality Zero or One to One and Only One
 * @param link
 */
function add_link_01_11(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
        var li = createLink(pst.shape, ptt.shape, "Physical", "", "", "", link._isSoft);
        var l = new SQL_Link(pst.shape, ptt.shape, "Physical", "", "", "", link._isSoft, li, link._label, link._sourceisweak, link._targetisweak);
        if (pst.shape.id == ptt.shape.id) {
            get_pk_as_fk(ptt, pst, false, true, true);
        } else {
            get_pk_as_fk(ptt, pst, false, true, true);
        }
        physical_links_list.push(l);
    } catch (err) {
        call_error_dialog(err, "add link 01 -> 11");
    }
}
/**
 * Link with cardinality Zero or One to Zero or One or Many
 * @param link
 */
function add_link_01_0n1n(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
        if (standard == "true") {
            var positionS = pst.shape.get("position");
            var positionT = ptt.shape.get("position");
            var fields = [];
            var data = new SQL_Table_data(pst.data.table_name + "_" + ptt.data.table_name, fields);
            var physical_shape = createShape(((positionS.x + positionT.x) / 2), ((positionS.y + positionT.y) / 2), data.table_name, generate_fieldnames(data.fields, true), false, true);
            var t = new SQL_Table(null, physical_shape, data);
            if (pst.shape.id == ptt.shape.id) {
                get_pk_as_fk(pst, t, true, false, false);
                get_pk_as_fk(ptt, t, false, true, false);
            } else {
                get_pk_as_fk(pst, t, false, true, false);
                get_pk_as_fk(ptt, t, true, false, false);
            }
            physical_tables_list.push(t);
            var li1 = createLink(t.shape, ptt.shape, "Physical", "", "", "", link._isSoft);
            var li2 = createLink(t.shape, pst.shape, "Physical", "", "", "", link._isSoft);
            var l1 = new SQL_Link(t.shape, ptt.shape, "Physical", "", "", "", link._isSoft, li1, link._label, link._sourceisweak, link._targetisweak);
            var l2 = new SQL_Link(t.shape, pst.shape, "Physical", "", "", "", link._isSoft, li2, link._label, link._sourceisweak, link._targetisweak);
            physical_links_list.push(l1);
            physical_links_list.push(l2);
            if (pst.shape.id == ptt.shape.id) {
            	hide_link(l2);
            }
        } else {
            var li = createLink(ptt.shape, pst.shape, "Physical", "", "", "", link._isSoft);
            var l = new SQL_Link(ptt.shape, pst.shape, "Physical", "", "", "", link._isSoft, li, link._label, link._sourceisweak, link._targetisweak);
            get_pk_as_fk(pst, ptt, false, false, false);
            physical_links_list.push(l);
        }
    } catch (err) {
        call_error_dialog(err, "add link 01 -> 0n1n");
    }
}
/**
 * Link with cardinality One and Only One to Zero or One
 * @param link
 */
function add_link_11_01(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
        var li = createLink(ptt.shape, pst.shape, "Physical", "", "", "", link._isSoft);
        var l = new SQL_Link(ptt.shape, pst.shape, "Physical", "", "", "", link._isSoft, li, link._label, link._sourceisweak, link._targetisweak);
        
        if (pst.shape.id == ptt.shape.id) {
            get_pk_as_fk(pst, ptt, false, true, true);
        } else {
            get_pk_as_fk(pst, ptt, false, true, false);
        }
        
        physical_links_list.push(l);
    } catch (err) {
        call_error_dialog(err, "add link 11 -> 01");
    }
}
/**
 * Link with cardinality One and Only One to One and Only One
 * @param link
 */
function add_link_11_11(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
        // recursive relation
        if (pst.shape.id == ptt.shape.id) {
            var original_fields = [];
            
            for (var f = 0; f < pst.data.fields.length; f++) {
                var curr = pst.data.fields[f];
                var field = new SQL_Field(
                	curr.fieldName,
                	curr.fieldType,
                	curr.isPK,
                	curr.isFK,
                	curr.isAutoIncrement,
                	curr.isNotNull,
                	curr.isUnique,
                	curr.defaultValue,
                	curr.args
                );
                original_fields.push(field);
            }
            
            original_fields.reverse();
            
            for (var i = 0; i < ptt.data.fields.length; ++i) {
                if (ptt.data.fields[i].isPK) {
                    ptt.data.fields[i].isUnique = true;
                    ptt.data.fields[i].isNotNull = true;
                    ptt.data.fields[i].isFK = false;
                }
                ptt.data.fields[i].isPK = false;
                ptt.data.fields[i].isFK = false;
                ptt.data.fields[i].fieldName = ptt.data.table_name + "_" + ptt.data.fields[i].fieldName;
            }
            pst.data.table_name = pst.data.table_name + "_" + ptt.data.table_name;
            pst.data.fields = pst.data.fields.concat(original_fields);
            pst.data.fields.reverse();
            /*var positionS = pst.shape.get("position");
            var positionT = ptt.shape.get("position");
            var fields = [];

            var data = new SQL_Table_data(pst.data.table_name, fields);

            var physical_shape = createShape(((positionS.x + positionT.x) / 2),
            	((positionS.y + positionT.y) / 2),
            	data.table_name,
            	generate_fieldnames(data.fields, true),false,true);

            var t = new SQL_Table(null, physical_shape, data);

            get_pk_as_fk(pst, t, true, true, true);
            get_pk_as_fk(ptt, t, false, true, true);

            physical_tables_list.push(t);
            var li1 = createLink(t.shape, ptt.shape, "Physical", "", "", "", link._isSoft);
            var li2 = createLink(t.shape, pst.shape, "Physical", "", "", "", link._isSoft);
            var l1 = new SQL_Link(t.shape, ptt.shape, "Physical", "", "", "", link._isSoft, li1, link._label,link._sourceisweak, link._targetisweak);
            var l2 = new SQL_Link(t.shape, pst.shape, "Physical", "", "", "", link._isSoft, li2, link._label,link._sourceisweak, link._targetisweak);
            physical_links_list.push(l1);
            physical_links_list.push(l2);

            hide_link(l2);*/
        } else {
            if (table_is_weak_to(pst, ptt)) {
                ptt = physical_tables_list[search_table(link._source.id)];
                pst = physical_tables_list[search_table(link._target.id)];
            }
            for (var i = 0; i < ptt.data.fields.length; ++i) {
                if (ptt.data.fields[i].isPK) {
                    ptt.data.fields[i].isUnique = true;
                    ptt.data.fields[i].isNotNull = true;
                    ptt.data.fields[i].isPK = false;
                }
                ptt.data.fields[i].fieldName = ptt.data.table_name + "_" + ptt.data.fields[i].fieldName;
                ptt.data.fields[i].isFK = false;
            }
            for (var i = 0; i < pst.data.fields.length; ++i) {
                if (pst.data.fields[i].isPK) {
                	pst.data.fields[i].isFK = false;
                }
            }

            pst.data.fields = pst.data.fields.concat(ptt.data.fields);
            pst.data.table_name = pst.data.table_name + "_" + ptt.data.table_name;
            
            for (var i = 0; i < physical_links_list.length; ++i) {
                if (physical_links_list[i]._source == ptt.shape) {
                    physical_links_list[i]._source = pst.shape;
                }
                if (physical_links_list[i]._target == ptt.shape) {
                    physical_links_list[i]._target = pst.shape;
                }
            }
            
            for (var i = 0; i < conceptual_links_list_copy.length; ++i) {
                if (conceptual_links_list_copy[i]._source == ptt.shape) {
                    conceptual_links_list_copy[i]._source = pst.shape;
                }
                if (conceptual_links_list_copy[i]._target == ptt.shape) {
                    conceptual_links_list_copy[i]._target = pst.shape;
                }
            }
            ptt.shape = null;
        }
    } catch (err) {
        call_error_dialog(err, "add link 11 -> 11");
    }
}
/**
 * Link with cardinality One and Only One to Zero or One or Many
 * @param link
 */
function add_link_11_0n1n(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
        var li = createLink(ptt.shape, pst.shape, "Physical", "", "", "", link._isSoft);
        
        var l = new SQL_Link(
        	ptt.shape,
        	pst.shape,
        	"Physical",
        	"", "", "",
        	link._isSoft,
        	li,
        	link._label,
        	link._sourceisweak,
        	link._targetisweak
        );

        get_pk_as_fk(pst, ptt, false, true, false);
        physical_links_list.push(l);
    } catch (err) {
        call_error_dialog(err, "add link 11 -> 0n1n");
    }
}
/**
 * Link with cardinality Zero or One or Many to Zero or One
 * @param link
 */
function add_link_0n1n_01(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
        if (standard == "true") {
            var positionS = pst.shape.get("position");
            var positionT = ptt.shape.get("position");
            var fields = [];
            var data = new SQL_Table_data(pst.data.table_name + "_" + ptt.data.table_name, fields);
            var physical_shape = createShape(
            	((positionS.x + positionT.x) / 2),
            	((positionS.y + positionT.y) / 2),
            	data.table_name,
            	generate_fieldnames(data.fields, true),
            	false,
            	true
            );
            var t = new SQL_Table(null, physical_shape, data);
            
            if (pst.shape.id == ptt.shape.id) {
                get_pk_as_fk(pst, t, true, false, false);
                get_pk_as_fk(ptt, t, false, true, false);
            } else {
                get_pk_as_fk(pst, t, true, false, false);
                get_pk_as_fk(ptt, t, false, true, false);
            }
            
            physical_tables_list.push(t);
            
            var li1 = createLink(t.shape, ptt.shape, "Physical", "", "", "", link._isSoft);
            var li2 = createLink(t.shape, pst.shape, "Physical", "", "", "", link._isSoft);
            var l1 = new SQL_Link(
            	t.shape,
            	ptt.shape,
            	"Physical", "", "", "",
            	link._isSoft,
            	li1,
            	link._label,
            	link._sourceisweak,
            	link._targetisweak
            );
            var l2 = new SQL_Link(
            	t.shape,
            	pst.shape,
            	"Physical",
            	"", "", "",
            	link._isSoft,
            	li2,
            	link._label,
            	link._sourceisweak,
            	link._targetisweak
            );

            physical_links_list.push(l1);
            physical_links_list.push(l2);

            if (pst.shape.id == ptt.shape.id) {
            	hide_link(l2);
            }

        } else {
            var li = createLink(pst.shape, ptt.shape, "Physical", "", "", "", link._isSoft);
            var l = new SQL_Link(
            	pst.shape,
            	ptt.shape,
            	"Physical",
            	"", "", "",
            	link._isSoft,
            	li,
            	link._label
            );

            get_pk_as_fk(ptt, pst, false, false, false);
            physical_links_list.push(l);
        }
    } catch (err) {
        call_error_dialog(err, "add link 0n1n -> 01");
    }
}
/**
 * Link with cardinality Zero or One or Many to One and Only One
 * @param link
 */
function add_link_1n0n_11(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
        var li = createLink(pst.shape, ptt.shape, "Physical", "", "", "", link._isSoft);
        var l = new SQL_Link(
        	pst.shape,
        	ptt.shape,
        	"Physical",
        	"", "", "",
        	link._isSoft,
        	li,
        	link._label,
        	link._sourceisweak,
        	link._targetisweak
        );

        get_pk_as_fk(ptt, pst, false, true, false);
        physical_links_list.push(l);
    } catch (err) {
        call_error_dialog(err, "add link 1n0n -> 11");
    }
}
/**
 * Link with cardinality Zero or One or Many to Zero or One or Many
 * @param link
 */
function add_link_0n1n_0n1n(link) {
    try {
        var pst = physical_tables_list[search_table(link._source.id)];
        var ptt = physical_tables_list[search_table(link._target.id)];
        var positionS = pst.shape.get("position");
        var positionT = ptt.shape.get("position");
        var fields = [];
        var data = new SQL_Table_data(
        	pst.data.table_name + "_" + ptt.data.table_name, fields
        );

        var physical_shape = createShape(
        	((positionS.x + positionT.x) / 2),
        	((positionS.y + positionT.y) / 2),
        	data.table_name,
        	generate_fieldnames(data.fields, true),
        	false,
        	true
        );

        var t = new SQL_Table(null, physical_shape, data);
        get_pk_as_fk(pst, t, true, false, false);
        get_pk_as_fk(ptt, t, true, false, false);
        physical_tables_list.push(t);
        
        var li1 = createLink(t.shape, ptt.shape, "Physical", "", "", "", link._isSoft);
        var li2 = createLink(t.shape, pst.shape, "Physical", "", "", "", link._isSoft);
        var l1 = new SQL_Link(
        	t.shape,
        	ptt.shape,
        	"Physical",
        	"", "", "",
        	link._isSoft,
        	li1,
        	link._label,
        	link._sourceisweak,
        	link._targetisweak
        );

        var l2 = new SQL_Link(
        	t.shape,
        	pst.shape,
        	"Physical",
        	"", "", "",
        	link._isSoft,
        	li2,
        	link._label,
        	link._sourceisweak,
        	link._targetisweak
        );
		
		physical_links_list.push(l1);
        physical_links_list.push(l2);
        
        if (pst.shape.id == ptt.shape.id) {
        	hide_link(l2);
        }
    } catch (err) {
        call_error_dialog(err, "add link 0n1n -> 0n1n");
    }
}
/**
 * Copies table from conceptual to physical
 * @param table Conceptual Table
 * @returns {SQL_Table} Physical Table
 */
function copy_table(table) {
    try {
        // Generate new shape
        var position = table.shape.get("position");
        var data = copy_data(table.data);
        
        for (var i = table.data.fields.length - 1; i >= 0; --i) {
            data.fields.push(copy_field(table.data.fields[i]));
        }
        
        data.fields.reverse();
        var physical_shape = createShape(
        	position.x,
        	position.y,
        	data.table_name,
        	generate_fieldnames(data.fields, true),
        	false,
        	true
        );
        
        return new SQL_Table(null, physical_shape, data);
    } catch (err) {
        call_error_dialog(err, "copy table");
    }
}
/**
 * Copies table data from conceptual to physical
 * @param data Conceptual Table Data
 * @returns {SQL_Table_data} Physical Table Data
 */
function copy_data(data) {
    try {
        return new SQL_Table_data(
        	data.table_name,
        	data.hierType,
        	data.checkName,
        	data.checkCondition
        );
    } catch (err) {
        call_error_dialog(err, "copy data");
    }
}
/**
 * Copies table field from conceptual to physical
 * @param field Conceptual Table Field
 * @returns {PH_SQL_Field} Physical Table Field
 */
function copy_field(field) {
    try {
        return new PH_SQL_Field(
        	field.fieldName,
        	field.fieldType,
        	field.isPK,
        	field.isFK,
        	field.FKTable,
        	field.FKField,
        	field.isNotNull,
        	field.isUnique,
        	field.defaultValue,
        	field.isAutoIncrement,
        	field.args,
        	field.used
        );
    } catch (err) {
        call_error_dialog(err, "copy field");
    }
}
/**
 * Gets conceptual table from the physical table ID
 * @param id Physical Table ID
 * @param tables_match
 * @returns {*} Conceptual Table
 */
function get_conceptual_table_from_physical_id(id, tables_match) {
    for (var i = 0; i < conceptual_tables_list.length; i++) {
        if (tables_match[conceptual_tables_list[i].shape.id].id == id) {
            return conceptual_tables_list[i];
        }
    }
    return null;
}