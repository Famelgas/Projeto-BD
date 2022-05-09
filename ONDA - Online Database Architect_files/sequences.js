var default_values = {
	"Start With": "",
	"Min Value": "",
	"Max Value": "",
	"Increment By": "",
	"Cache": "",
	"Cycle": "",
	"No Cache": false
};


/**
 *Shape definition of a sequence table
 * @type {*}
 */
joint.shapes.basic.Conceptual_Sequence = joint.shapes.basic.Generic.extend({

	markup: '<g class="rotatable">' +
	'<g class="scalable">' +
	'<path stroke="#000000" d="M 100 0 L 20 0 20 40 100 40 105 30 105 10 Z" vector-effect="non-scaling-stroke" class="shape_base" id="shape-base"/>' +
	'<line vector-effect="non-scaling-stroke" class="shape_divisor" />' +
	'</g>' +
	'<text id="title" font-family="Ubuntu Mono" />' +
	'<text id="fields" font-family="Ubuntu Mono" />' +
	'<g class="scalable">' +
	'<rect vector-effect="non-scaling-stroke" class="shape_base_aux"/>' +
	'</g>' +
	'</g>',

	defaults: joint.util.deepSupplement({
        type: 'basic.Conceptual_Sequence',
        attrs: {
            'path': {
                fill: TABLE_COLOR.SEQUENCE,
                "stroke-width": 1
            },
            'line': {
                x1: 20,
                x2: 105,
                y1: 10,
                y2: 10,
                stroke: "black",
                "stroke-width": 1
            },
            '#title': {
                'font-size': 14,
                'ref-x': 0.5,
                'ref-y': 5,
                ref: 'path',
                'y-alignment': 'top',
                'x-alignment': 'middle',
                fill: "black"
            },
            '#fields': {
                'font-size': 13,
                'ref-x': 0.02,
                'ref-y': 0.0,
                ref: 'path',
                'y-alignment': 'top',
                'x-alignment': 'left',
                fill: "black"
            },
            '.shape_base_aux': {
                opacity: 0
            }
        }
    }, joint.shapes.basic.Generic.prototype.defaults)
});


/**
 * data structure of a field of a sequence table
 * @param name
 * @param value
 * @constructor
 */
function SequenceField(name, value) {
	try {
		if (value === undefined) {
			value = default_values[name];
		}

		this.fieldName = name;
		this.value = value;
	} catch (err) {
		call_error_dialog(err, "sequence field");
	}
}


/**
 * Contains the table name and an array of fields (of type sql_field)
 * @param seq_name
 * @param fields
 * @constructor
 */
function SequenceTableData(seq_name, fields)
{
	try {
		this.table_name = seq_name;
		this.fields = fields;
		this.sequence = true;

		if ((this.fields === undefined) || (this.fields === null)) {
			this.fields = [];
		}
	} catch (err) {
		call_error_dialog(err, "sequence table data");
	}
}

/**
 * Contains the table data and respective canvas element
 * @param rect
 * @param shape
 * @param data
 * @constructor
 */
function Sequence_Table(rect, shape, data)
{
	try {
		this.rect = rect;	// Stores the drawn element
		this.shape = shape; // Stores the shape used by Graph from Joint.js
		this.data = data;	// has type SQL_Table_data
	} catch (err) {
		call_error_dialog(err, "sequence table");
	}
}

/**
 * Generate sequence fields
 * @returns {Array}
 */
function generate_sequence_fields()
{
	try {
		var fields = [];
		for (f in default_values) {
			fields.push(new SequenceField(f));
		}
		return fields;
	} catch (err) {
		call_error_dialog(err, "generate sequence fields");
	}
}

/**
 * Create new sequence
 */
function create_new_sequence()
{
    if (current_table !== null) {
        remove_table_highlight(current_table);
    }

    clear_table_properties_panel();
    SEQUENCE_ID++;
    var x = -paper.options.origin.x * (1 / scale);
    var y = -paper.options.origin.y * (1 / scale);
    var seq_fields = generate_sequence_fields();

    while (true) {
        for (i = conceptual_tables_list.length - 1; i >= 0; --i) {
            if (conceptual_tables_list[i].shape.attributes.position.x == x ||
            	conceptual_tables_list[i].shape.attributes.position.y == y) {
                x += 30 * (1 / scale);
                y += 30 * (1 / scale);
                break;
            }
        }
        if (i == -1) {
            break;
        }
    }
    
    var seq = create_sequence_table(graph, x, y, "Sequence_" + SEQUENCE_ID, seq_fields);
    conceptual_tables_list.push(seq);
    show_sequence_properties(null, seq, null);
    LogStatus("Sequence created");
}

/**
 * Changing sequence field value
 * @param field
 */
function changing_seq_field_value(field, check, sequence)
{
    if (!sequence) {
        sequence = current_table;
    }

    var fieldName = sequence.data.fields[field].fieldName;
    var value = sequence.data.fields[field].value;
    var selected = $('#sequence_field_' + field).val();
    //console.log("selected = " + selected);
    var seqName = sequence.data.table_name;

    if (!check) {
        if (fieldName == "Cycle") {
            sequence.data.fields[field].value = !sequence.data.fields[field].value;
        } else if (fieldName == "No Cache") {
            sequence.data.fields[field].value = !sequence.data.fields[field].value;
            if ($('#properties_no_cache').prop("checked")) {
            	sequence.data.fields[4].value = false;
            } else {
            	sequence.data.fields[4].value = 2;
            }
        }

        /*Retirei o <= no selected < 1*/
        else if (fieldName == "Cache" && selected == "") {
            sequence.data.fields[field].value = "";
        } else if (fieldName == "Cache" && Number(selected) <= 1) {
            sequence.data.fields[field].value = false;
        } else if (fieldName == "Cache" && Number(selected) > 1) {
            sequence.data.fields[6].value = false;
            $('#properties_no_cache').prop("checked", false);
            sequence.data.fields[field].value = selected;
        } else {
        	sequence.data.fields[field].value = selected;
        }
        update_table_graph();
        return true;
        
    } else {
        selected = value;
        //console.log("selected = " + selected);
        if (fieldName == "Increment By" && selected == "0") {
            LogStatus("Error on " + seqName + ": 'Increment' must not be zero", true);
            //$('#sequence_field_' + field).val(value);
            return false;
        } else if (fieldName == "Min Value" && selected != "") {
            if (sequence.data.fields[field + 1].value != "" && Number(selected) >= sequence.data.fields[field + 1].value) {
                LogStatus("Error on " + seqName + ": Min Value cannot be equal or greater than Max Value", true);
                //$('#sequence_field_' + field).val(value);
                return false;
            } else if (sequence.data.fields[0].value != "" && Number(selected) > sequence.data.fields[0].value) {
                LogStatus("Error on " + seqName + ": Min Value cannot be greater than the Start value", true);
                //$('#sequence_field_' + field).val(value);
                return false;
            }
        } else if (fieldName == "Max Value" && selected != "") {
            if (sequence.data.fields[field - 1].value != "" && Number(selected) <= sequence.data.fields[field - 1].value) {
                LogStatus("Error on " + seqName + ": Max Value cannot be equal or lesser than Min Value", true);
                //$('#sequence_field_' + field).val(value);
                return false;
            } else if (sequence.data.fields[0].value != "" && Number(selected) < sequence.data.fields[0].value) {
                LogStatus("Error on " + seqName + ": Max Value cannot be lesser than the Start value", true);
                //$('#sequence_field_' + field).val(value);
                return false;
            }
        }
    }
    update_table_graph(sequence);
    return true;
}

/**
 * Create sequence table
 * @param graph
 * @param x
 * @param y
 * @param name
 * @param fields
 * @returns {*}
 */
function create_sequence_table(graph, x, y, name, fields)
{
    //try{
    var fieldNames = [];
    var lenght = fields.length;

    for (var i = 0, f = 0; i < lenght; i++, f++) {
        if (fields[i].value === "" || fields[i].fieldName == "No Cache") {
            f--;
            continue;
        }
        fieldNames.push(fields[i].fieldName);
        for (var j = fieldNames[f].length; j < MAX_FIELD_CHARS + 1; j++)
            fieldNames[f] += " ";
        fieldNames[f] += fields[i].value;
    }

    // Create sequence shape
    var shape = createShape(x, y, name, fieldNames, true);
    graph.addCell(shape);
    
    // Create sequence data
    var data = new SequenceTableData(name, fields);
    
    // Create sequence something
    var rects = $('.Conceptual_TableElement');
    
    // rectSelected
    var rects_top_layers = $('.shape_base_aux');
    var sequence = null;
    
    length = rects.length;
    for (var i = 0; i < length; i++) {
        if (rects[i].getAttribute("model-id") == shape.id) {
            sequence = new Sequence_Table(rects[i], shape, data);
            $(rects_top_layers[i]).on("mousedown", show_sequence_properties.bind(null, null, sequence));
            $(rects_top_layers[i]).on("touchstart", show_sequence_properties.bind(null, null, sequence));
            $(rects_top_layers[i]).on("touchmove", show_sequence_properties.bind(null, null, sequence));
            break;
        }
    }

    current_table = sequence;
    update_table_graph();
    current_table = null;
    return sequence;
    /*} catch(err){
     call_error_dialog(err,"create sequence table");
     }*/
}

/**
 * Show sequence properties
 * @param event
 * @param table
 * @param forceUpdate
 */
function show_sequence_properties(event, table, forceUpdate)
{
    if ((table == current_table) && (forceUpdate !== true)) {
        return;
    }

    if (current_table !== null) {
        remove_table_highlight(current_table);
    }

    clear_table_properties_panel();
    current_table = table;

    if (current_link !== null) {
        current_link = null;
    }

    highlight_sequence(table);
    
    // Sequence Name
    var tablename = '<label>Sequence Name:</label>';
    tablename += '<input id="table-name-input" type="text" oninput="changing_table_name()" value="' + table.data.table_name + '">';
    tablename += '<button id="tools-delete-table" onclick="delete_table()">' + '<img src="icons/clear.png">' + '</button>';
    
    $("#properties_table_name").html(tablename);
    // Table Fields
    var tableProperties = '<table>' + '<tr>' + '<th><label>Parameters</label></th>' + '</tr>' + '</table>';
    // Add Each Field
    var length = table.data.fields.length;

    for (var i = 0; i < length; i++) {
        tableProperties += gen_sequence_field_html(i);
        //tableProperties += '<br>';
    }

    $("#properties_fields").html(tableProperties);
    // Highlight Table Name If Already Exists
    check_for_existing_tablename();
    LogStatus("Sequence selected");
}

/**
 * Generate code to display a sequence field
 * @param i
 * @returns {*}
 */
function gen_sequence_field_html(i)
{
    var field_name, field = current_table.data.fields[i];
    // no cache, because
    if (i == 6) {
        return "";
    }
    field_name = '<table class="properties-view-fields"><tr><td><br>' + field.fieldName + ": ";
    // Cycle parameter is a checkbox, the others are inputs
    if (field.fieldName == "Cycle") {
        field_name += '<input id="properties_cycle_' + i + '" class="properties-pk" type="checkbox" value="cycle" onclick="changing_seq_field_value(' + i + ')"';
        if (field.value) {
            field_name += 'checked ';
        }
        field_name += '/></td></tr></table>';
    } else if (field.fieldName == "Cache") {
        field_name += '<input id="sequence_field_' + i + '" class="properties-field" type="number" value="' + field.value + '" size="5" oninput="changing_seq_field_value(' + i + ')"/></td>';
        // No Cache nao deve ser checkbox, a pedido do professor.. lembrar que NOCACHE nao existe em todos os DBMS
        /*field_name += "No Cache:" + '<input id="properties_no_cache" class="properties-pk" type="checkbox" onclick="changing_seq_field_value(6)"';


		if (current_table.data.fields[6].value) {
			field_name += 'checked /></td>';
		} else
            field_name += '/></td>';
		*/
    } else {
        field_name += '<input id="sequence_field_' + i + '" class="properties-field" type="number" onkeypress="return event.charCode >= 48 && event.charCode <= 57" value="' + field.value + '" size="5" oninput="changing_seq_field_value(' + i + ')"/></td>';
    }
    return '<div class="properties-field">' + field_name + '</div>';
}

/* Returns true if there any sequences in the canvas, false otherwise */
function existSequences()
{
	for (var i = 0; i < conceptual_tables_list.length; i++) {
		if (conceptual_tables_list[i].data.sequence) {
			return true;
		}
	}
	return false;
}


/**
 * Returns true if the given table is a sequence table, false otherwise
 * @param table
 * @returns {boolean}
 */
function tableIsSequence(table)
{
	return table.data.sequence;
}

function getSequences()
{
    var seq = [];
    var len;
    for (var i = 0; i < conceptual_tables_list.length; i++) {
        if (tableIsSequence(conceptual_tables_list[i])) {
            seq.push(conceptual_tables_list[i]);
        }
    }
    if (seq.length > 0) {
        return seq;
    }
    return null;
}
