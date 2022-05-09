var pin_toggle = false;
var id_timeout;

function changeImage() {
    if (pin_toggle  === true) {
        document.getElementById("img-properties-pin").src = 'icons/pin.png';
        LogStatus("Properties bar pinned");
        pin_toggle = false;
    } else {
        document.getElementById("img-properties-pin").src = 'icons/unpin.png';
        LogStatus("Properties bar unpinned");
        pin_toggle = true;
    }
}

$(function () {
    $("#properties_container").mouseover(function () {
        clearTimeout(id_timeout);
    });
});

$(function () {
    $("#properties_container").on("mouseleave", function () {
        if (pin_toggle === true) {
            id_timeout = setTimeout(function () {
                if (current_diagram === 0) {
                    $("#properties_container").css({"visibility": "hidden"});
                    $("#properties_container").stop().animate({
                        width: 0
                    }, function () {
                        $(this).hide();
                    });
                    $("#paper_container").stop().animate({
                        width: window.innerWidth - 4
                    });
                    document.getElementById("v-2").setAttribute("width", window.innerWidth);
                    $(this).addClass('expanded');
                    var x = document.getElementById("mouseover_container");
                    x.style.display = "block";
                }
            }, 1000);
        }
    });
});


$(function () {
    $('#curr-btn-link, #prev-btn-link').click(function () {
        $('#curr-version, #prev-version').slideToggle();
    });
    $('.click-nav > ul').toggleClass('no-js js');
    $('.click-nav .js ul').hide();
    $('.click-nav .js').click(function (e) {
        $('.click-nav .js ul').slideToggle(200);
        $('.clicker').toggleClass('active');
        e.stopPropagation();
    });
});

$(function () {
    $("#dialog-confirm").hide(); //hides dialog div
});

/**
 * Handles the sidebar button
 * On click, it toggles the sidebar, expanding the canvas to the position
 * where the properties sidebar was. On the second click it toggles again
 * to the original position.
 */
$(function () {
    $("#expand-bt").on("click", function () {

        $(".properties-container").css({"visibility": "visible"});
        document.getElementById("v-2").setAttribute("width", window.innerWidth - 315);
        $("#paper_container").stop().animate({
            width: window.innerWidth - 315
        });

        $("#properties_container").stop().animate({
            width: 327 // properties sidebar has 310 pixels
        }, function () {
            $(this).show();
            return;
        });
        $(this).removeClass('expanded');
        var x = document.getElementById("mouseover_container");
        x.style.display = "none";
        var img = document.getElementById("img-properties-pin");
        img.src = "icons/unpin.png";
        LogStatus("Properties Tab Expanded");
    });

});

/* ******************************************* */
/* Init */
var reservedWords = [
    "MAX", "MODIFY", "NATIONAL", "NCHAR", "NEW", "NEXT", "NONE", "NOT", "NULL", "NUMERIC", "ON", "ONLY", "OPEN",
    "ADD", "AFTER", "ALL", "ALTER", "ANALYZE", "AND", "ANY", "AS", "ASC", "BEFORE", "BEGIN", "BLOB", "BY", "END",
    "CASCADE", "CHAR", "CHARACTER", "CHECK", "CLOSE", "COLUMN", "COMMIT", "CONSTRAINT", "CONTINUE", "ESCAPE",
    "CREATE", "CURRENT", "CURRENT_USER", "CURSOR", "DATABASE", "DATE", "DEALLOCATE", "DEC", "DECIMAL", "ADD",
    "DECLARE", "DEFAULT", "DELETE", "DESC", "DISTINCT", "DOUBLE", "DROP", "EACH", "ELSE", "GLOBAL", "VARCHAR",
    "EXECUTE", "FALSE", "FLOAT", "FOR", "FOREIGN", "FROM", "FULL", "FUNCTION", "VALUES", "GROUP", "SAVEPOINT",
    "HAVING", "IN", "INSERT", "INT", "INTEGER", "INTO", "IS", "ISOLATION", "KEY", "LIKE", "LIMIT", "TIMESTAMP",
    "OPTION", "OR", "ORDER", "PRECISION", "PRESERVE", "PRIMARY", "READ", "REAL", "REFERENCES", "WORK", "SOME",
    "RETURN", "REVOKE", "ROLLBACK", "ROW", "SCHEMA", "SELECT", "SESSION", "SET", "SMALLINT", "LOCAL", "WHERE",
    "START", "TABLE", "TEMPORARY", "THAN", "THEN", "TIME", "TRANSACTION", "USING", "VALUE", "USER", "VARYING",
    "TRIGGER", "TRUE", "UNION", "UNIQUE", "UPDATE", "USAGE", "WITH", "WRITE", "YEAR", "TO", "GRANT"
];

var paperWidth = undefined;
var paperHeight = undefined;
var conceptual_tables_list = [];
var conceptual_links_list = [];
var graph = null;
var commandManager = null;
var paper = null;
var shapeWidth = 300;
var sequenceWidth = 200;
var physicalWidth = 320;
var shapeMargin = 5;
var titleHeight = 16;
var fieldHeight = 14;
var current_table = null;
var current_link = null;
var isTableHighlighted = false;
var isSequenceHighlighted = false;

var MAX_TITLE_CHARS = 17;
var MAX_FIELD_CHARS = 16;
var MAX_LINK_LABEL_CHARS = 20;
var ACTION_LOG_FADE_TIME = 1200;
var ENTITY_ID = -1;
var SEQUENCE_ID = -1;
var tipoDB = "Default";
var flag = true;
var sidebarButtonClicked = false;
var campos = "";
var aux = false;

HIER_TYPE = {
    SINGLE: "single",
    CONCRETE: "concrete",
    COMPLETE: "complete"
};

TABLE_COLOR = {
    ENTITY: "#EEE",
    SEQUENCE: "#FDC769"
};

DEFAULT_FIELD_TYPE = 3; // current index of the "BigInt" field type

var MAX_SCALE = 4.0;
var MIN_SCALE = 0.1;
var scale = 1.0;

var field_closed_icon = "icons/go_left.png";
var field_opened_icon = "icons/go_down.png";
var fieldChangeUp = "icons/up.png";
var fieldChangeDown = "icons/down.png";

var conceptual_scale = 1.0;
var physical_scale = 1.0;
var conceptual_origin = {"x": 0, "y": 0};
var physical_origin = {"x": 0, "y": 0};

var current_state = 0;      // State Machine: 0->main (create/remove/manage tables), 1->links (create tables relations)
var current_diagram = 0;    // State Machine of the current diagram: 0->conceptual, 1-> physical, 2->scripts

var standard = "true";

var Debugger = function () {
};

Debugger.log = function (m) {
    try {
        console.log(m);
    } catch (exception) {
    }
};

window.onload = function () {
    $('html').css('overflow', 'hidden');
    page_loaded();
};

$(window).resize(function () {
    $("#log").append("<div>Handler for .resize() called.</div>");
    if (flag == true) {
    }
});


/**
 * Start with the default database.
 */
function startDefault() {
    try {
        flag = false;
        tipoDB = "Default";
    } catch (err) {
        call_error_dialog(err, "start default");
    }
}

/**
 * Load page.
 */
function page_loaded() {
    try {
        if (getBrowser() == "Safari") {
            $("*").css("zoom", "0.98 !important");
        }

        // disable backspace on firefox
        // to go back on Chrome => Alt + Left
        // to go back on Firefox => backspace
        // to go back on Opera => Alt + Left
        // to go back on safari => CMD + [ or cmd+alt+5
        $(document).on("keydown", function (e) {
            if (e.which === 8 && !$(e.target).is("input, textarea")) {
                e.preventDefault();
            }
        });

        // disable "Enter" key
        $(document).on("keypress", "form", function (event) {
            return event.keyCode != 13;
        });

        // Toolbar Label
        $("#operations-bt-new-file").on("mouseover", function () {
            $("#label-bt-new-file").css({
                "opacity": 1,
                "left": $("#img-new").position().left + $("#img-new").width() * 2, "top": -13
            });
        });

        $("#operations-bt-new-file").on("mouseout", function () {
            $("#label-bt-new-file").css({"opacity": 0});
        });

        $("#operations-lb-open").on("mouseover", function () {
            $("#label-bt-open").css({
                "opacity": 1,
                "left": $("#img-open").position().left + $("#img-open").width() * 2, "top": -13
            });
        });

        $("#operations-lb-open").on("mouseout", function () {
            $("#label-bt-open").css({"opacity": 0});
        });

        $("#operations-bt-save").on("mouseover", function () {
            $("#label-bt-save").css({
                "opacity": 1,
                "left": $("#img-save").position().left + $("#img-save").width() * 2, "top": -13
            });
        });

        $("#operations-bt-save").on("mouseout", function () {
            $("#label-bt-save").css({"opacity": 0});
        });

        $("#operations-bt-export").on("mouseover", function () {
            $("#label-bt-export").css({
                "opacity": 1,
                "left": $("#img-export").position().left + $("#img-export").width() * 2, "top": -13
            });
        });

        $("#operations-bt-export").on("mouseout", function () {
            $("#label-bt-export").css({"opacity": 0});
        });

        $("#run_SQL").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#clear_results").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});

        //$("#operations-bt-undo"    ).on("mouseover", function () {   $("#label-bt-undo"     ).css({"opacity":1, "left":"222px"});    } );
        //$("#operations-bt-undo"    ).on("mouseout",  function () {   $("#label-bt-undo"     ).css({"opacity":0});    } );
        //$("#operations-bt-redo"    ).on("mouseover", function () {   $("#label-bt-redo"     ).css({"opacity":1, "left":"260px"});    } );
        //$("#operations-bt-redo"    ).on("mouseout",  function () {   $("#label-bt-redo"     ).css({"opacity":0});    } );

        $("#operations-bt-zoom-in").on("mouseover", function () {
            $("#label-bt-zoom-in").css({
                "opacity": 1,
                "left": $("#img-zoom-in").position().left + $("#img-zoom-in").width() * 2
            });
        });

        $("#operations-bt-zoom-in").on("mouseout", function () {
            $("#label-bt-zoom-in").css({"opacity": 0});
        });

        $("#operations-bt-zoom-out").on("mouseover", function () {
            $("#label-bt-zoom-out").css({
                "opacity": 1,
                "left": $("#img-zoom-out").position().left + $("#img-zoom-out").width() * 2, "top": -13
            });
        });

        $("#operations-bt-zoom-out").on("mouseout", function () {
            $("#label-bt-zoom-out").css({"opacity": 0});
        });

        $("#tools-bt-add-table").on("mouseover", function () {
            $("#label-bt-add-table").css({
                "opacity": 1,
                "left": $("#img-add").position().left + $("#img-add").width() * 2, "top": -13
            });
        });

        $("#tools-bt-add-table").on("mouseout", function () {
            $("#label-bt-add-table").css({"opacity": 0});
        });

        $("#normal").on("mouseover", function () {
            $("#label-normal").css({"opacity": 1, "left": 360, "top": -13});
        });

        $("#normal").on("mouseout", function () {
            $("#label-normal").css({"opacity": 0});
        });

        $("#parenting").on("mouseover", function () {
            $("#label-parenting").css({"opacity": 1, "left": 390, "top": -13});
        });

        $("#parenting").on("mouseout", function () {
            $("#label-parenting").css({"opacity": 0});
        });

        $("#sequence").on("mouseover", function () {
            $("#label-sequence").css({
                "opacity": 1,
                "left": $("#img-sequence").position().left + $("#img-sequence").width() * 2, "top": -13
            });
        });

        $("#sequence").on("mouseout", function () {
            $("#label-sequence").css({"opacity": 0});
        });

        $("#help").on("mouseover", function () {
            $("#label-help").css({
                "opacity": 1,
                "left": $("#img-help").position().left + $("#img-help").width() * 2, "top": -13
            });
        });

        $("#help").on("mouseout", function () {
            $("#label-help").css({"opacity": 0});
        });
        $("#run_SQL").on("mouseover", function () {
            $("#label-runSQL").css({
                "opacity": 1,
                "left": $("#img-run-SQL-editor").position().left + $("#img-run-SQL-editor").width() * 2
            });
        });

        $("#run_SQL").on("mouseout", function () {
            $("#label-runSQL").css({"opacity": 0});
        });

        $("#clear_results").on("mouseover", function () {
            $("#label-clearSQL").css({
                "opacity": 1,
                "left": $("#img-clear-SQL-result").position().left + $("#img-run-SQL-editor").width() * 2
            });
        });

        $("#clear_results").on("mouseout", function () {
            $("#label-clearSQL").css({"opacity": 0});
        });

        $("#sidebar").on("mouseover", function () {
            // Show "hide sidebar" information
            if (sidebarButtonClicked === false) {
                $("#label-sidebar").css({
                    "opacity": 1,
                    "left": $("#img-help").position().left + $("#img-sequence").width() * 10,
                    "top": -13
                });

                $("#sidebar").on("mouseout", function () {
                    $("#label-sidebar").css({"opacity": 0});
                });
                // Show "show sidebar" information
            } else {
                $("#label-sidebar2").css({
                    "opacity": 1,
                    "left": $("#img-help").position().left + $("#img-sequence").width() * 10,
                    "top": -13
                });

                $("#sidebar").on("mouseout", function () {
                    $("#label-sidebar2").css({"opacity": 0});
                });
            }
        });

        //Create Dropdown Button that allows the user to change the DB to use
        var dropdown = '';
        var option_start = '<a ';
        var option_before = ' href="#" onclick="redraw_view(\'';
        var option_mid = '\')">';
        var option_after = '</a>';

        var defined = false;
        for (var i = 0; i < Object.getOwnPropertyNames(scripts).length; i++) {
            var db_opt = Object.getOwnPropertyNames(scripts)[i];
            var db_version = scripts[db_opt].version;
            if (db_opt != "Default") {
                dropdown += option_start + 'id=dropshit_option_' + (i + 1) + option_before + db_opt +
                    option_mid + db_opt + " " + db_version + option_after;
                // Set the default DB as the first one
                if (!defined) {
                    db_chosen = db_opt;
                    defined = true;
                }
            }
        }

        $("#dropdown-content").html(dropdown);
        $("#dropbtn_title").html(db_chosen);
        $("#dropdown-content-small").html(dropdown);
        $("#dropbtn_title-small").html(db_chosen);

        startDefault();
        // View
        switch_view(0);

        // Resize Container When Window is Resized
        window.onresize = function () {

            var properties_container_width = $(properties_container).width();
            var paper_container_width = $("#paper_container").width();
            var left_space = 4;
            var to_fill = (window.innerWidth - properties_container_width - paper_container_width - left_space);
            paper_container_width += to_fill;
            paper_container_width += 'px';

            document.getElementById("paper_container").style.width = paper_container_width;

            paperWidth = $("#paper_container").width();
            paperHeight = $("#paper_container").height();

            paper.setDimensions(paperWidth, paperHeight);
            //console.log(window.innerWidth);
        };

        $('#operations-bt-zoom-in').on("click", function () {
            scale_canvas(scale + 0.1);
        });    // Activate Zoom In button

        $('#operations-bt-zoom-out').on("click", function () {
            scale_canvas(scale - 0.1);
        });   // Activate Zoom Out button

        var paper_container = $('#paper_container')[0];

        // Main
        paperWidth = $("#paper_container").width();
        paperHeight = $("#paper_container").height();

        var gridSize = 1;

        graph = new joint.dia.Graph();
        paper = new joint.dia.Paper({
            el: $('#paper_container'),
            width: paperWidth,
            height: paperHeight,
            model: graph,
            gridSize: gridSize,
            elementView: ClickableView
        });

        commandManager = new joint.dia.CommandManager({graph: graph});

        $('#operations-bt-undo').click(function () {
            commandManager.undo();
        });

        $('#operations-bt-redo').click(function () {
            commandManager.redo();
        });

        paper.on('cell:pointerdblclick',
            function(cellView, evt, x, y) {
                if (cellView.model.get('type') === 'basic.Conceptual_TableElement')
                {
                    if (pin_toggle == true)
                    {
                        $(".properties-container").css({"visibility": "visible"});

                        document.getElementById("v-2").setAttribute("width", window.innerWidth - 315);
                        $("#paper_container").stop().animate({
                            width: window.innerWidth - 315
                        });

                        $("#properties_container").stop().animate({
                            width: 327,
                            // properties sidebar has 327 pixels
                        }, function () {
                            $(this).show();
                            document.getElementById("table-name-input").focus();
                            return;
                        });
                        // $(this).removeClass('expanded');
                        var x = document.getElementById("mouseover_container");
                        x.style.display = "none";
                        var img = document.getElementById("img-properties-pin");
                        img.src = "icons/unpin.png";
                        LogStatus("Properties Tab Expanded");

                    }
                    else
                    {
                        document.getElementById("table-name-input").focus();
                    }
                }
                else
                {
                    if (pin_toggle == true)

                    {
                        $(".properties-container").css({"visibility": "visible"});

                        document.getElementById("v-2").setAttribute("width", window.innerWidth - 315);
                        $("#paper_container").stop().animate({
                            width: window.innerWidth - 315
                        });

                        $("#properties_container").stop().animate({
                            width: 327,
                            // properties sidebar has 327 pixels
                        }, function () {
                            $(this).show();
                            document.getElementById("link_name_input").focus();
                            return;
                        });
                        // $(this).removeClass('expanded');
                        var x = document.getElementById("mouseover_container");
                        x.style.display = "none";
                        var img = document.getElementById("img-properties-pin");
                        img.src = "icons/unpin.png";
                        LogStatus("Properties Tab Expanded");

                    }
                    else
                    {
                        document.getElementById("link_name_input").focus();
                    }
                }
            });

        canvas = $('#v-2');		// Get canvas (canvas is an SVG and is named 'v-2' by joint.js)
        /*document.getElementById("v-2").setAttribute("width", window.innerWidth-310-30);
        document.getElementById("paper_container").setAttribute("width", window.innerWidth-30);*/

        canvas.on('mousedown', canvas_mouseDown_trigger);	// Enable canvas drag

        var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";

        // firefox
        if (mousewheelevt == "DOMMouseScroll") {
            canvas.on("DOMMouseScroll", canvas_mouseWheel_trigger);
        } else {
            canvas.on("mousewheel", canvas_mouseWheel_trigger); // Enable canvas scale via mouse wheel
        }

        canvas.on('touchstart', canvas_touchStart_trigger); // Enable canvas drag

    } catch (err) {
        call_error_dialog(err, "load page");
    }

    $('#operations-bt-open')[0].addEventListener('change', open_diagram, false);

    $("#tutorial").joyride({
        modal: true,
        expose: true,
        postRideCallback: function () {
            $('#tutorial').joyride('destroy');
        }
        /* TODO maybe change this in order to open tutorial only on first time */
    });
}

var ClickableView = joint.dia.ElementView.extend({
    events: {
        'mouseover': 'mouseovercard',
        'mouseout': 'mouseoutcard'
    },
    mouseoutcard: function(evt, x, y)
    {
        $("#tooltip_container").css({"visibility": "hidden"});
        clearTimeout(time);
    },
    mouseovercard: function(evt, x, y,) {

        if (this.model.get('attrs').title.text.length > MAX_TITLE_CHARS || this.model.get('attrs').title.text.length > MAX_FIELD_CHARS)
        {

            var tooltip  = this.model.get('attrs').title.text;

            var z = document.getElementById("tooltip_container");
            z.innerHTML=tooltip;
            posx = window.event.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
            posy = window.event.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
            $("#tooltip_container").css({'top': posy-50 ,'left': posx})
            time = setTimeout(function () {
                $("#tooltip_container").css({"visibility": "visible"});
            },1000);
        }
    },

    pointerdblclick: function (evt, x, y) {
        this.notify('cell:pointerdblclick', evt, x, y);
        joint.dia.ElementView.prototype.pointermove.apply(this, arguments);
    }
});

/* ******************************************* */

/* Tutorial */

/**
 * Starts the tutorial.
 * It selects the appropriate tutorial depending on window size and visible buttons.
 */
function runTutorial() {

    var htmlStr = "<ol id='tutorial'>" +
        "<li data-button='Start tutorial'><p>Welcome to <b>ONDA</b>!<br><br>You can use the ENTER key to go to the next slide<br><br>Close this window to skip tutorial.<br></p></li> " +
        "<li data-id='operations-bt-new-file'><p>Create a new file<br></p></li> " +
        "<li data-id='operations-lb-open'><p>Open existing diagram<br></p></li> " +
        "<li data-id='operations-bt-save'><p>Save created diagram (.json) <br></p></li> " +
        "<li data-id='operations-bt-export'><p>Export created diagram (.png) <br></p></li> " +
        "<li data-id='operations-bt-undo'><p>Undo<br></p></li> " +
        "<li data-id='operations-bt-redo'><p>Redo<br></p></li> " +
        "<li data-id='operations-bt-zoom-in'><p>Zoom in your diagram<br></p></li> " +
        "<li data-id='operations-bt-zoom-out'><p>Zoom out your diagram<br></p></li> " +
        "<li data-id='tools-bt-add-table'><p>Add a new entity<br></p></li> " +
        "<li data-id='normal'><p>Create relations between entities<br></p></li> " +
        "<li data-id='parenting'><p>Create inheritance relations<br></p></li> " +
        "<li data-id='sequence'><p>Add a new sequence<br></p></li> " +
        "<li data-id='dropshit'><p>Choose Database<br><br> You can select your database engine to generate the DDL scripts<br></p></li> " +
        "<li data-id='dropshit_select'><p>Choose Normalization<br><br> You can select between Normal or Simplified normalization!<br></p></li> " +
        "<li data-options='nubPosition:top-right' data-id='view-bt-conceptual'><p>Conceptual Model of the Diagram<br></p></li> " +
        "<li data-options='nubPosition:top-right' data-id='view-bt-physical'><p>Physical Model of the Diagram<br></p></li> " +
        "<li data-options='nubPosition:top-right' data-id='view-bt-scripts'><p>DDL Scripts of the Diagram<br><br> You can use the DDL to generate a database<br></p></li> " +
        "<li data-options='nubPosition:top-right' data-id='view-bt-SQLEditor'><p>SQL Editor<br><br> You can make queries to a local database<br></p></li> " +
        "<li data-button='Let&#44;s do this!'><p>Thanks for using <b>ONDA</b>!<br></p></li> " +
        "</ol>";

    var htmlStr2 = "<ol id='tutorial'>" +
        "<li data-button='Start tutorial'><p>Welcome to <b>ONDA</b>!<br><br>You can use the ENTER key to go to the next slide<br><br>Close this window to skip tutorial.<br></p></li> " +
        "<li data-id='operations-bt-new-file'><p>Create a new file<br></p></li> " +
        "<li data-id='operations-lb-open'><p>Open existing diagram<br></p></li> " +
        "<li data-id='operations-bt-save'><p>Save created diagram (.json) <br></p></li> " +
        "<li data-id='operations-bt-export'><p>Export created diagram (.png) <br></p></li> " +
        "<li data-id='operations-bt-undo'><p>Undo<br></p></li> " +
        "<li data-id='operations-bt-redo'><p>Redo<br></p></li> " +
        "<li data-id='operations-bt-zoom-in'><p>Zoom in your diagram<br></p></li> " +
        "<li data-id='operations-bt-zoom-out'><p>Zoom out your diagram<br></p></li> " +
        "<li data-id='tools-bt-add-table'><p>Add a new entity<br></p></li> " +
        "<li data-id='normal'><p>Create relations between entities<br></p></li> " +
        "<li data-id='parenting'><p>Create inheritance relations<br></p></li> " +
        "<li data-id='sequence'><p>Add a new sequence<br></p></li> " +
        "<li data-id='dropshit-small'><p>Choose Database<br><br> You can select your database engine to generate the DDL scripts<br></p></li> " +
        "<li data-id='dropshit_select-small'><p>Choose Normalization<br><br> You can select between Normal or Simplified normalization!<br></p></li> " +
        "<li data-options='nubPosition:top-right' data-id='view-bt-conceptual2'><p>Conceptual Model of the Diagram<br></p></li> " +
        "<li data-options='nubPosition:top-right' data-id='view-bt-physical2'><p>Physical Model of the Diagram<br></p></li> " +
        "<li data-options='nubPosition:top-right' data-id='view-bt-scripts2'><p>DDL Scripts of the Diagram<br><br> You can use the DDL to generate a database<br></p></li> " +
        "<li data-options='nubPosition:top-right' data-id='view-bt-SQLEditor2'><p>SQL Editor<br><br> You can make queries to a local database<br></p></li> " +
        "<li data-button='Let&#44;s do this!'><p>Thanks for using <b>ONDA</b>!<br></p></li> " +
        "</ol>";

    // if ($("#view-bt-physical").is(":visible")) {
    if (document.body.offsetWidth > 1250) {
        document.getElementById("tutorial-container").innerHTML = htmlStr;
        //console.log("Starting tutorial 1");
        $("#tutorial").joyride({
            postRideCallback: function () {
                $('#tutorial').joyride('destroy');
            }
        });
    } else {
        document.getElementById("tutorial-container").innerHTML = htmlStr2;
        //console.log("Starting tutorial 2");
        $("#tutorial").joyride({
            postRideCallback: function () {
                $('#tutorial').joyride('destroy');
            }
        });
    }
}

/* ******************************************* */

/* Canvas Events */

/**
 * Scale canvas with mouse wheel
 * @param mouseEvent
 */
function canvas_mouseWheel_trigger(mouseEvent) {
    // http://www.javascriptkit.com/javatutors/onmousewheel.shtml
    try {
        // if firefox
        if (mouseEvent.type == "DOMMouseScroll") {
            var delta = mouseEvent.originalEvent.detail;

            // delta returns -9 when wheel is scrolled up, 9 when down
            var _wheelDeltaY_ = (delta == -9) ? 120 : -120;

            var newscale = scale + _wheelDeltaY_ * 0.01;
            mouseEvent.preventDefault()

            scale_canvas(newscale);
        } else {
            mouseEvent = mouseEvent.originalEvent;
            if (mouseEvent.wheelDeltaY === 0)
                return;
            var newscale = scale + mouseEvent.wheelDeltaY * 0.01;
            scale_canvas(newscale);
        }
    } catch (err) {
        call_error_dialog(err, "mousewheel trigger");
    }
}

/**
 * Start dragging canvas
 * @param e
 */

function canvas_touchStart_trigger(e) {
    try {
        e = e.originalEvent;
        if (e.touches.length == 1) {
            if (e.touches[0].target.id != 'v-2')
                return; // If didn't click on an empty area -> stop (NOTE: 'v-2' is a name defined by joint.js)

            if (current_table !== null) {
                remove_table_highlight(current_table);
                current_table = null;
            }
            clear_table_properties_panel();

            var startX = e.touches[0].clientX;	// Initial touch position (X)
            var startY = e.touches[0].clientY;	// Initial touch position (Y)

            var originX = paper.options.origin.x; // Initial paper origin (X)
            var originY = paper.options.origin.y; // Initial paper origin (Y)

            function canvas_touchMove_trigger(e) {
                e = e.originalEvent;
                if (e.touches[0].target.id != 'v-2')
                    return;

                paper.setOrigin(
                    originX + (e.touches[0].clientX - startX),
                    originY + (e.touches[0].clientY - startY)
                );

                //$("v-2").css({"opacity":"1","cursor":"drag","pointer-events":"all"});
				LogStatus("Dragging canvas");
            }

            canvas.off("touchmove");
            canvas.on("touchmove", canvas_touchMove_trigger);
        }
    } catch (err) {
        call_error_dialog(err, "touchstart trigger");
    }
    // Future possible pinch to zoom support
    // else if (e.originalEvent.touches.length == 2){
    // }
}

/**
 * Click on canvas and none table is selected and all the highlights disappear
 * @param mouseEvent
 */
function canvas_mouseDown_trigger(mouseEvent) {
	var dragging_canvas=false;
    try {
        mouseEvent = mouseEvent.originalEvent;
        if (mouseEvent.button !== 0)
            return;	// If it is not left button -> stop
        if (mouseEvent.target.id != 'v-2')
            return;	// If didn't click on an empty area -> stop (NOTE: 'v-2' is a name defined by joint.js)

        if (current_table !== null) {
            remove_table_highlight(current_table);
            current_table = null;
        }
        clear_table_properties_panel();

        var startX = mouseEvent.clientX;  // Initial mouse position (X)
        var startY = mouseEvent.clientY;  // Initial mouse position (Y)

        var originX = paper.options.origin.x;  // Initial paper origin (X)
        var originY = paper.options.origin.y;  // Initial paper origin (Y)

        canvas.on('mousemove', canvas_mouseMove_trigger);  // When mouse moves after click on canvas
        canvas.on('mouseup', canvas_mouseUp_trigger);      // When mouse is released after click on canvas
        canvas.on('mousedown', canvas_mouseDown_trigger);
    } catch (err) {
        call_error_dialog(err, "mouseDown trigger");
    }

    /**
     * Strop dragging canvas
     * @param mouseEvent
     * Update canvas position when mouse button is released
     */
    function canvas_mouseUp_trigger(mouseEvent) {
        try {
            mouseEvent = mouseEvent.originalEvent;
            canvas.off('mouseup');   // Disable event to not allow release if mouse click starting outside
            canvas.off('mousemove'); // Translation is only enabled if event started with a mousedown inside the valid area

            paper.setOrigin(
                originX + (mouseEvent.clientX - startX),
                originY + (mouseEvent.clientY - startY)
            );

            $("#paper_container").removeClass("grabbable");
			if(dragging_canvas){
				LogStatus("Canvas moved");
				dragging_canvas=false;
			}
        } catch (err) {
            call_error_dialog(err, "mouseUp trigger");
        }
    }


    /**
     * Update canvas position while dragging
     * @param mouseEvent
     */
    function canvas_mouseMove_trigger(mouseEvent) {
        try {
            mouseEvent = mouseEvent.originalEvent;

            paper.setOrigin(
                originX + (mouseEvent.clientX - startX),
                originY + (mouseEvent.clientY - startY)
            );

            $("#paper_container").addClass("grabbable");

			if (isTableHighlighted) {
                $("#paper_container").removeClass("grabbable");
				LogStatus("Dragging table");
            }
			else if (isSequenceHighlighted){
				 $("#paper_container").removeClass("grabbable");
				LogStatus("Dragging sequence");
			}
			else{
				LogStatus("Dragging canvas");
				dragging_canvas=true;}
        } catch (err) {
            call_error_dialog(err, "mouseMove trigger");
        }
    }

    function canvas_mouseDown_trigger(mouseEvent) {
        try {
            //mouseEvent = mouseEvent.originalEvent;

            /*paper.setOrigin(
                originX + (mouseEvent.clientX - startX),
                originY + (mouseEvent.clientY - startY)
            );*/


            $("#paper_container").addClass("grabbable");

            if (isTableHighlighted) {
                $("#paper_container").removeClass("grabbable");
				LogStatus("Entity selected");
            }
			else if (isSequenceHighlighted){
				 $("#paper_container").removeClass("grabbable");
				LogStatus("Sequence selected");
			}
			else
				LogStatus("Canvas selected");
        } catch (err) {
            call_error_dialog(err, "mouseMove trigger");
        }
    }

    LogStatus("Canvas selected");
}

/* ******************************************* */

/* Toolbar  */
/**
 * Creates new diagram and cleans all the arrays and canvas
 * @returns {number}
 */
function new_file() {
    try {
        var d = confirm('Are you sure you want to create a new diagram?');
        if (d == false) {
            return -1;
        }
        ENTITY_ID = -1;
        // Remove all cells
        for (var i = conceptual_tables_list.length - 1; i >= 0; i--) {
            graph.removeLinks(conceptual_tables_list[i].shape);
            graph.get("cells").remove(conceptual_tables_list[i].shape);
        }

        // Clear conceptual lists
        conceptual_tables_list = [];
        conceptual_links_list = [];

        // Reset view
        switch_view(0);

        // Reset scale and position
        scale_canvas(1);
        paper.setOrigin(0, 0);

        weak_entities = {};

        if (current_table !== null) {
            remove_table_highlight(current_table);
            current_table = null;
        }
        clear_table_properties_panel();

        LogStatus("Panel cleared");
    } catch (err) {
        call_error_dialog(err, "new file");
    }
}

/**
 * Executed when a file is set to be opened. When the file finishes loading, executes read_diagram()
 * @param e
 */
function open_diagram(e) {
    try {
        var input = document.getElementsByTagName('input')[0];

        input.onclick = function () {
            this.value = null;
        };

        input.onchange = function () {
            alert(this.value);
        };

        var file = e.target.files[0];

        if (file) {
            var tokens = file.name.split(".");
            var extension = tokens[tokens.length - 1];

            $('#operations-bt-open')[0].addEventListener('change', open_diagram, false);

            if (!(extension === "json")) {
                alert("Error: file extension is not .json");
                return;
            }
        } else {
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var contents = e.target.result;

            read_diagram(contents);
        };
        reader.readAsText(file);
    } catch (err) {
        call_error_dialog(err, "open diagram ");
    }
}

/**
 * Read a diagram from json file
 * @param JSONObject
 */
function read_diagram(JSONObject) {	// When the file is loaded, read content
    try {
        var extracted = JSON.parse(JSONObject);	// convert to structure

        if (new_file() == -1) {
            return;
        } // Clear the screen

        ENTITY_ID = extracted.ENTITY_ID;

        // Read and create conceptual tables
        var tables = extracted.tables;
        var _database = extracted.database;
        var _normalization = extracted.normalization;

        redraw_view(_dbs_[_database]);

        document.getElementById("_database").value = "" + _dbs_[_database];

        // 0 -> simplefied
        // 1 -> normal
        if (_normalization == 0) {
            changeNormalization('false');
            document.getElementById("_normalization").value = "false";
        } else {
            changeNormalization('true');
            document.getElementById("_normalization").value = "true";
        }

        var oldIDs = []; // Stores old tables' IDs to find the source and target of all links (when loaded, JointJS generates new IDs)

        if (tables !== undefined) {
            var count = tables.length;

            for (var i = 0; i < count; i++) {
                var t = tables[i];
                oldIDs.push(t.id);

                // Read and create fields for the current table
                var fields = [];
                var fieldsCount = t.data.fields.length;

                // table is sequence
                if (t.data.sequence) {

                    for (var j = 0; j < fieldsCount; j++) {
                        var f = t.data.fields[j];
                        fields.push(new SequenceField(f.fieldName, f.value));
                    }

                    var newSequence = create_sequence_table(
                        graph, t.position.x, t.position.y, t.data.table_name, fields
                    );
                    newSequence.data.next_id = t.data.next_id;

                    conceptual_tables_list.push(newSequence);
                }

                // normal table
                else {
                    for (var j = 0; j < fieldsCount; j++) {
                        var fData = t.data.fields[j];
                        var f = new SQL_Field(
                            fData.fieldName,
                            fData.fieldType,
                            fData.isPK,
                            fData.isFK,
                            fData.isAutoIncrement,
                            fData.isNotNull,
                            fData.isUnique,
                            fData.defaultValue,
                            fData.args
                        );
                        fields.push(f);
                    }

                    // Create table and add to list
                    var newTable = create_sql_table(
                        graph,
                        t.position.x,
                        t.position.y,
                        t.data.table_name,
                        fields,
                        t.data.checkName,
                        t.data.checkCondition
                    );
                    newTable.data.next_id = t.data.next_id;

                    conceptual_tables_list.push(newTable);
                }
            }
        }

        // Read and create conceptual links
        var links = extracted.links;
        if (links !== undefined) {
            count = links.length;
            for (var i = 0; i < count; i++) {
                var l = links[i];

                addNewLink(
                    getTableWithIDFromOldIDs(l.source, oldIDs).shape,
                    getTableWithIDFromOldIDs(l.target, oldIDs).shape,
                    l.order,
                    l.hierType,
                    l.sourceCard,
                    l.targetCard,
                    l.isSoft,
                    l.sourceisweak,
                    l.targetisweak
                );

                current_link = conceptual_links_list[conceptual_links_list.length - 1];
                update_link_label(undefined, l.label);
                current_link = null;
            }
        }

        set_weak_entities(conceptual_links_list);

        LogStatus("Conceptual Diagram loaded");
    } catch (err) {
        call_error_dialog(err, "read diagram");
    }
}

/**
 * Save a diagram in json format and reload page
 */
function save_diagram_and_reload() {
    $('#file_name').val($('#file_name_error').val())
    save_diagram();
    location.reload(true)
}

/**
 * Save a diagram in json format
 */
function save_diagram() {
    try {

        //var _dbs_ = ["PostgreSQL","Oracle","MySQL","MariaDB","SQLite"];
        //var _norm_ = ["Normal","Simplified"];
        // Create tables content to store
        var count = conceptual_tables_list.length;
        var tables = [];

        for (var i = 0; i < count; i++) {
            var element = {};
            element.id = conceptual_tables_list[i].shape.id;
            element.position = conceptual_tables_list[i].shape.get("position");
            element.data = conceptual_tables_list[i].data;
            tables.push(element);
        }

        // Create links content to store
        var count = conceptual_links_list.length;
        var links = [];
        for (var i = 0; i < count; i++) {
            var element = {};
            element.source = conceptual_links_list[i]._source.id;
            element.target = conceptual_links_list[i]._target.id;
            element.order = conceptual_links_list[i]._order;
            element.sourceCard = conceptual_links_list[i]._sourceCard;
            element.targetCard = conceptual_links_list[i]._targetCard;
            element.isSoft = conceptual_links_list[i]._isSoft;
            element.label = conceptual_links_list[i]._label;
            element.hierType = conceptual_links_list[i]._hierType;
            element.sourceisweak = conceptual_links_list[i]._sourceisweak;
            element.targetisweak = conceptual_links_list[i]._targetisweak;
            links.push(element);
        }

        var _database = document.getElementById("_database").selectedIndex;
        var _normalization = document.getElementById("_normalization").selectedIndex;

        //var norm_selected = _norm_[_normalization] == "Normal" ? "true" : "false";

        var toSave = JSON.stringify({
            "ENTITY_ID": ENTITY_ID,
            "tables": tables,
            "links": links,
            "normalization": _normalization,
            "database": _database
        });

        if (getBrowser() == "Safari") {
            var file_name = $("#file_name").val() + ".json";
            download(toSave, file_name, "text/plain");
        } else {
            saveFile("json", toSave, "text/plain", "Conceptual Diagram saved");
        }

    } catch (err) {
        call_error_dialog(err, "save diagram");
    }
}

/**
 * Save file in a json diagram
 * @param name
 * @param content
 * @param type
 * @param onTerminationMessage
 *
 */
function saveFile(name, content, type, onTerminationMessage) {
    try {
        // Prep blob
        var blob = new Blob([content], {type: type + ";charset=utf-8"});

        if (name === "json") {
            var n = $("#file_name").val();
            if (n == "")
                n = "Conceptual Diagram";
            n += '.json';
            $("#file_name").val("");
        } else if (name === "txt") {
            var n = $("#filenameTxt").val();
            if (n == "")
                n = "Generated DDL";
            n += '.txt';
            $("#filenameTxt").val("");
        }


        // reset file name


        // Setup
        var object_url = (window.URL || window.webkitURL || window).createObjectURL(blob);
        var output = document.createElement('a');
        output.href = object_url;

        output.download = n;

        output.id = "download_link_tmp";
        output.target = "_blank";

        // Add event to execute on close dialog
        $(window).on("focus", function () {
            if (onTerminationMessage !== undefined) {
                LogStatus(onTerminationMessage)
            }
            $(window).off("focus");
        });

        // Open Save Dialog
        document.body.appendChild(output);
        // output.click();
        //console.log($("#download_link_tmp"));
        $("#download_link_tmp")[0].click();
        document.body.removeChild(output);
    } catch (err) {
        call_error_dialog(err, "save file");
    }
}

/**
 * Export diagram text
 */
function export_diagram_txt() {
    // For Script Export
    if (current_diagram == 2) {
        saveFile("txt", script, "text/plain", "Script exported");
    }
}


/**
 * Export diagram
 */
function export_diagram() {
    try {

        // For Diagram Export
        var EXPORTED_IMAGE_MARGIN = 5;

        // Scale canvas to real size and Move canvas to make sure all tables
        // are after (0,0) in the resulting image
        var _SCALE = 1.7; // 0.1 < Scale < 2.0
        var old_scale = scale;
        scale_canvas(_SCALE);

        var old_origin_x = paper.options.origin.x;
        var old_origin_y = paper.options.origin.y;

        // First Must reset origin to (0,0)
        paper.setOrigin(0, 0);

        // Find the borders of the image
        // Left and Top are the lowest table positions
        // Right and Bottom are the highest table positions + width or height
        var current_tables_list = current_diagram === 0 ? conceptual_tables_list : physical_tables_list;
        var minX = undefined, // Left limit
            minY = undefined, // Top limit
            maxX = undefined, // Right limit
            maxY = undefined; // Bottom limit
        for (var i = current_tables_list.length - 1; i >= 0; i--) {
            var pos = current_tables_list[i].shape.get("position");
            var size = current_tables_list[i].shape.get("size");

            if ((minX === undefined) || (pos.x < minX)) minX = pos.x;
            if ((minY === undefined) || (pos.y < minY)) minY = pos.y;

            if ((maxX === undefined) || ( (pos.x + size.width ) > maxX)) maxX = pos.x + size.width;
            if ((maxY === undefined) || ( (pos.y + size.height) > maxY)) maxY = pos.y + size.height;
        }

        // Link Vertices may be outside of the limits. So, update borders if necessary
        var VERTICES_OFFSET = 5; // If the vertice is in the extreme of the image, add this offset to the position
        var current_links_list = current_diagram === 0 ? conceptual_links_list : physical_links_list;
        for (var i = current_links_list.length - 1; i >= 0; i--) {
            var vertices = current_links_list[i]._link.get('vertices');
            for (var j = vertices.length - 1; j >= 0; j--) {
                if (vertices[j].x - VERTICES_OFFSET < minX) minX = vertices[j].x - VERTICES_OFFSET;
                if (vertices[j].y - VERTICES_OFFSET < minY) minY = vertices[j].y - VERTICES_OFFSET;

                if (vertices[j].x + VERTICES_OFFSET > maxX) maxX = vertices[j].x + VERTICES_OFFSET;
                if (vertices[j].y + VERTICES_OFFSET > maxY) maxY = vertices[j].y + VERTICES_OFFSET;
            }
        }

        // Set the origin based on the left and top borders
        if (minX !== undefined) {
            paper.setOrigin(
                -minX*_SCALE + EXPORTED_IMAGE_MARGIN,
                -minY*_SCALE + EXPORTED_IMAGE_MARGIN
            );
        }

        // Size is difined by the limits + margin
        var paperWidth =  (maxX - minX)*_SCALE + 2 * EXPORTED_IMAGE_MARGIN;
        var paperHeight = (maxY - minY)*_SCALE + 2 * EXPORTED_IMAGE_MARGIN;

        // Get th SGV tree
        var svgDoc = paper.svg;

        var serializer = new XMLSerializer();
        var svgString = serializer.serializeToString(svgDoc);

        // Change width and height here (in the string svgString)
        var index = svgString.indexOf("width") + 7;
        var svgString_sub = svgString.substring(index);
        var index2 = svgString_sub.indexOf('"');
        svgString = svgString.substring(0, index) + paperWidth + svgString_sub.substring(index2);

        index = svgString.indexOf("height") + 8;
        svgString_sub = svgString.substring(index);
        index2 = svgString_sub.indexOf('"');
        svgString = svgString.substring(0, index) + paperHeight + svgString_sub.substring(index2);

        // changed: exported image has the same font has in the canvas
        var position = svgString.indexOf("defs") - 1;
        // get fonts used in the canvas from canvasFont js file
        var canvasFont = "<style type=\"text/css\">" + CanvasFont + "</style>";

        var svgStringNEW = svgString.substr(0, position) + canvasFont + svgString.substr(position);


        svgStringNEW = svgStringNEW.replace(/Ubuntu Mono/g, "ubuntu_monoregular");

        // check if new relation was created
        if (svgStringNEW.indexOf("text-anchor=\"middle\"") != -1) {
            svgStringNEW = svgStringNEW.replace(
                /text-anchor="middle"/g,
                "font-family='open_sansregular' text-anchor=\"middle\""
            );
        }

        // comment if-else to remove bold title from exported image
        if (svgStringNEW.indexOf("id=\"title\" font-family=\"ubuntu_monoregular\"") != -1) {
            svgStringNEW = svgStringNEW.replace(
                /id="title" font-family="ubuntu_monoregular"/g,
                "id=\"title\" font-family=\"ubuntu_monobold\""
            );
        }

        // SVG image is ready. Create PNG
        // Create a canvas and draw the image on it
        var canvastemp = document.createElement("canvas");
        var ctx = canvastemp.getContext("2d");

        var img = document.createElement("img");

        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgStringNEW));

        img.onload = function () {
            // Must define Width and Height
            canvastemp.setAttribute("height", paperHeight);
            canvastemp.setAttribute("width", paperWidth);

            // Draw image on temporary canvas
            ctx.drawImage(img, 0, 0);

            // Export image
            if ($("#filenameExp").val() == "")
                $("#filenameExp").val("Conceptual");
            var image_name = current_diagram === 0 ? $("#filenameExp").val() + ".png" : $("#filenameExp").val() + ".png";

            $(window).on("focus", function () {
                LogStatus((current_diagram === 0 ? "Conceptual" : "Physical") + " Diagram exported");
                $(window).off("focus");
            });

            Canvas2Image.saveAsPNG(image_name, canvastemp);

            // Restore canvas position to original
            paper.setOrigin(old_origin_x, old_origin_y);
            scale_canvas(old_scale);

            //what
            if (current_diagram == 0) $("#filenameExp").val("");
            if (current_diagram == 1) $("#filenameExp").val("");
        };
    } catch (err) {
        call_error_dialog(err, "export diagram");
    }
}


/* ******************************************* */

/* View */

/**
 * @param newDB
 * Redraw the current view. This is called when the DB to use is changed and the canvas need to be redrawn.
 */
function redraw_view(newDB) {
    try {
        if ((newDB == "MySQL" || newDB == "SQLite") && existSequences()) {
            //LogStatus("WARNING: MySQL DBMS does not support definition of sequences.
            // You can use the Auto Increment clause instead. Delete the sequences in order to continue.",true);
            LogStatus("WARNING:" + newDB + " does not support Sequences!", true);
            return;
        }

        // Update the chosen DB
        db_chosen = newDB;
		if (db_chosen==undefined)
			db_chosen="PostgreSQL";
        $("#dropbtn_title").html(newDB);
        $("#dropbtn_title-small").html(newDB);


        // Redraw canvas / Recreate scripts
        if (current_diagram == 0) {

            for (var i = 0; i < conceptual_tables_list.length; i++)
                update_table_graph(conceptual_tables_list[i]);

            if (current_table != null) {
                if (current_table.data.sequence)
                    show_sequence_properties(null, current_table, true);
                else
                    show_table_properties(null, current_table, true);
            }

        } else {
            var temp = current_diagram;
            switch_view(0);
            switch_view(temp);
        }
    } catch (err) {
        call_error_dialog(err, "redraw view");
    }
}

/**
 * Disable buttons
 * @param butao
 */
function disableButtons(butao) {
    document.getElementById(butao).disabled = true;
}

/**
 * Switches view between conceptual, physical and scripts
 * @param new_view
 * @param force
 */
// Machine state -> disable current settings, enable new settings
function switch_view(new_view, force, standardChanged) {

    var isResizing;

    if (force == undefined)
        force = false;
    if (current_diagram == new_view && !force)
        return;
    if (new_view != 0 && check_names() == true) {
        return;
    }

    if (standardChanged) {
        if (standard == "true")
            LogStatus("Changed Physical Diagram's Standard to Normal");
        else
            LogStatus("Changed Physical Diagram's Standard to Simplified");
    }

    var temp = current_table;

    if (existSequences()) {
        var sequences = getSequences();
        for (seq in sequences) {
            for (var i = 0; i < sequences[seq].data.fields.length; i++) {
                current_table = sequences[seq];
                if (!changing_seq_field_value(i, true, current_table)) {
                    current_table = temp;
                    return;
                }
            }
        }
    }

    current_table = temp;

    set_strong_entities();

    /*if (strong_entities.length == 0 && Object.keys(weak_entities).length > 0) {
        LogStatus("Error: Detected cycle of weak entities", true);
        return;
    }*/

    //$(".properties-container").css("display","none");
    // Disable current view settings
    if (current_diagram === 0) { // Current view is the Conceptual Diagram View
        try {

            $(".table_relation").attr("disabled", true);
            $("#tools-bt-add-table").attr("disabled", true);
            $("#tools-bt-add-table").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#normal").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#parenting").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#sequence").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            // Select the classes and the IDs with these characteristics and shows
            $("#view-bt-conceptual").css({"background-color": "transparent", "color": "black"});
            $("#view-bt-conceptual").on("mouseover", mouseOverConceptual);
            $("#view-bt-conceptual").on("mouseout", mouseOutConceptual);
            $("#view-bt-conceptual2").css({"background-color": "transparent", "color": "black"});
            $("#view-bt-conceptual2").on("mouseover", mouseOverConceptual);
            $("#view-bt-conceptual2").on("mouseout", mouseOutConceptual);
            $(".conceptual-container").css({"visibility": "hidden"});


            if (graph !== null) { // graph is a property of JoinJS
                if (current_table !== null) {
                    remove_table_highlight(current_table); // Remove the selection around the table (entity)
                    current_table = null;
                }
                clear_table_properties_panel(); // Clear all table properties on the right side

                $('.shape_base_aux').off("mousedown");
                $('.shape_base_aux').off("touchstart");
                $('.shape_base_aux').off("touchmove");
                $(".tool-options").off("click");

                // We need save the links between the entities to generate after the new diagram (graph) with all links between them
                // Backup conceptual_links_list because the method that removes the link from the graph also
                // removes the link from conceptual_links_list, and that call needs to be there
                var conceptual_links_list_backup = [];
                for (var i = conceptual_links_list.length - 1; i >= 0; i--) {
                    conceptual_links_list_backup.push(conceptual_links_list[i]);
                }

                var temp_weak = {};

                for (f in weak_entities) {
                    temp_weak[f] = weak_entities[f];
                }

                // Remove all cells
                for (var i = conceptual_tables_list.length - 1; i >= 0; i--) {
                    if (conceptual_tables_list[i].data.sequence)
                        continue;

                    graph.removeLinks(conceptual_tables_list[i].shape);
                    graph.get("cells").remove(conceptual_tables_list[i].shape);
                }

                // Restore links list
                for (var i = conceptual_links_list_backup.length - 1; i >= 0; i--) {
                    conceptual_links_list.push(conceptual_links_list_backup[i]);
                }

                // We need also save all positions of the origin diagram to guarantee some order between the entities
                // Store scale and point of origin of the conceptual diagram
                conceptual_scale = scale;
                conceptual_origin["x"] = paper.options.origin.x;
                conceptual_origin["y"] = paper.options.origin.y;

                for (f in temp_weak) {
                    weak_entities[f] = temp_weak[f];
                }

                warning_inheritance_pk();
                warning_weak_entities_pk();
            }
        }
        catch (err) {
            call_error_dialog(err, "current diagram 0");
        }
    }
    else if (current_diagram == 1) { // Current view is the Physical Diagram View
        try {


            $("#view-bt-physical").css({"background-color": "transparent", "color": "black"});
            $("#view-bt-physical").on("mouseover", mouseOverPhysical);
            $("#view-bt-physical").on("mouseout", mouseOutPhysical);
            $("#view-bt-physical2").css({"background-color": "transparent", "color": "black"});
            $("#view-bt-physical2").on("mouseover", mouseOverPhysical);
            $("#view-bt-physical2").on("mouseout", mouseOutPhysical);

            $("#tools-bt-add-table").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#normal").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#parenting").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#sequence").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});

            $(".conceptual-container").css({"visibility": "hidden"});
            if (pin_toggle  === true) {
                $("#mouseover_container").css("display", "block");
            }


            if (graph !== null) {
                if (current_table !== null) {
                    remove_table_highlight(current_table); // Remove the selection around the table (entity)
                    current_table = null;
                }
                clear_table_properties_panel(); // Clear all table properties on the right side

                $(".tool-options").off("click");


                //graph.resetCells();
                /*for (var i = physical_links_list.length - 1; i >= 0; i--) {
                 graph.removeLinks( physical_tables_list[i].shape );
                 }*/

                var temp = weak_entities;

                // Remove all cells
                for (var i = physical_tables_list.length - 1; i >= 0; i--) {
                    graph.removeLinks(physical_tables_list[i].shape);
                    graph.get("cells").remove(physical_tables_list[i].shape);
                }

                /*for ( var i= sequences_tables.length-1; i>=0; i--){
                 graph.removeLinks(sequences_tables[i].shape);
                 graph.get("cells").remove(sequences_tables[i].shape);
                 }*/

                weak_entities = temp;

                physical_tables_list = [];
                //sequences_tables = [];

                // We need also save all positions of the origin diagram to guarantee some order between the entities
                // Store scale and point of origin of the conceptual diagram
                physical_scale = scale;
                physical_origin["x"] = paper.options.origin.x;
                physical_origin["y"] = paper.options.origin.y;


                //console.log(paper.svg);
            }
        }
        catch (err) {
            call_error_dialog(err, "current diagram 1");
        }
    }
    else if (current_diagram == 2) { // Current view is the Scripts View
        try {
            $("#view-bt-scripts").css({"background-color": "transparent", "color": "black"});
            $("#view-bt-scripts").on("mouseover", mouseOverScripts);
            $("#view-bt-scripts").on("mouseout", mouseOutScripts);
            $("#view-bt-scripts2").css({"background-color": "transparent", "color": "black"});
            $("#view-bt-scripts2").on("mouseover", mouseOverScripts);
            $("#view-bt-scripts2").on("mouseout", mouseOutScripts);
            $("#script_container").css({"visibility": "hidden"});

            $("#tools-bt-add-table").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#normal").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#parenting").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#sequence").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            if (pin_toggle  === true) {
                $("#mouseover_container").css("display", "block");
            }


            // Remove all cells
            for (var i = physical_tables_list.length - 1; i >= 0; i--) {
                graph.removeLinks(physical_tables_list[i].shape);
                graph.get("cells").remove(physical_tables_list[i].shape);
            }
            physical_tables_list = [];
        }
        catch (err) {
            call_error_dialog(err, "current diagram 2");
        }

    }
    else if (current_diagram == 3) { // Current view is the SQLEditor View
        try {
            $("#view-bt-SQLEditor").css({"background-color": "transparent", "color": "black"});
            $("#view-bt-SQLEditor").on("mouseover", mouseOverSqlEditor);
            $("#view-bt-SQLEditor").on("mouseout", mouseOutSQLEditor);
            $("#view-bt-SQLEditor2").css({"background-color": "transparent", "color": "black"});
            $("#view-bt-SQLEditor2").on("mouseover", mouseOverSqlEditor);
            $("#view-bt-SQLEditor2").on("mouseout", mouseOutSQLEditor);

            $("#tools-bt-add-table").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#normal").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#parenting").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#sequence").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});

            $("#properties_container").css("display", "");
            if (pin_toggle  === true) {
                $("#mouseover_container").css("display", "block");
            }
            $("#sql_editor_container").css({"visibility": "hidden"});
            $("#sql_editor_bar_button_request").css({"visibility": "hidden"});
            $("#sql_editor_bar_button_clear").css({"visibility": "hidden"});

            $("#run_SQL").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#clear_results").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});

        }
        catch (err) {
            call_error_dialog(err, "current diagram 3");
        }

    }


    // Enable new view settings
    if (new_view === 0) { // New view is the Conceptual Diagram View

        try {

            if (pin_toggle  === true) {
                $("#properties_container").css({
                    "width": "0px"
                });
                $("#paper_container").css({
                    "width": window.innerWidth - 4
                });
                $("mouseover_container").css({"display": "block"});
                // make the canvas occupy the whole monitor width
                document.getElementById("v-2").setAttribute("width", window.innerWidth - 30);
            } else {
                document.getElementById("v-2").setAttribute("width", window.innerWidth - 310 - 30);
                $("#paper_container").css({
                    "width": window.innerWidth - 310 - 13
                });
                $("#properties_container").css({
                    "width": "327px"
                });
                $("mouseover_container").css({"display": "none"});
            }

            $(".normalization-select").prop("disabled", false);
            $(".database-select").prop("disabled", false);

            $(".table_relation").attr("disabled", false);
            $("#tools-bt-add-table").attr("disabled", false);
            $("#label-bt-open").html("Open Conceptual Diagram");
            $("#label-bt-save").html("Save Conceptual Diagram (.json)");
            $("#label-bt-export").html("Export Conceptual Diagram (.png)");
            $('#operations-bt-export').attr('data-target', '#modalPNG');
            $("#view-bt-conceptual").css({"background-color": "#428bca", "color": "white"});
            $("#view-bt-conceptual2").css({"background-color": "#428bca", "color": "white"});
            // Remove Event
            $("#tools-bt-add-table").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#normal").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#parenting").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#sequence").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#view-bt-conceptual").off("mouseover", mouseOverConceptual);
            $("#view-bt-conceptual").off("mouseout", mouseOutConceptual);
            $("#view-bt-conceptual2").off("mouseover", mouseOverConceptual);
            $("#view-bt-conceptual2").off("mouseout", mouseOutConceptual);
            // Action
            $(".conceptual-container").css({"visibility": "visible"});

            tipoDB = "Default"; //para vermos sempre o array default no conceptual !!!!!!!!!!

            if (graph !== null) {
                // Create all cells
                for (var i = conceptual_tables_list.length - 1; i >= 0; i--) {
                    graph.addCell(conceptual_tables_list[i].shape);
                    update_table_graph(conceptual_tables_list[i]);
                }
                // Links
                for (var i = conceptual_links_list.length - 1; i >= 0; i--) {
                    graph.addCell(conceptual_links_list[i]["_link"]);
                }
                // To put on the right position
                paper.setOrigin(conceptual_origin["x"], conceptual_origin["y"]);
                scale = conceptual_scale;
                paper.scale(scale, scale);

                enable_main_events(true);
                $(".tool-options").on("click", show_link_properties);

                LogStatus("Switched to Conceptual View");
            }

        } catch (err) {
            call_error_dialog(err, "vista conceptual");
        }
    }
    else if (new_view == 1) { // New view is the Physical Diagram View


        // make the canvas occupy the whole monitor width
        document.getElementById("v-2").setAttribute("width", window.innerWidth);


        //$(".normalization-select").prop("disabled",true)
        $(".database-select").prop("disabled", true);
        $("#operations-bt-open").attr("enabled", true);
        $("#label-bt-open").html("Open Physical Diagram");
        $("#label-bt-save").html("Export Physical Diagram (.json)");
        $('#operations-bt-export').attr('data-target', '#modalPNG');

        $("#label-bt-save").html("Save Physical Diagram (.json)");
        $('#operations-bt-export').attr('data-target', '#modalPNG');
        $("#label-bt-export").html("Export Physical Diagram (.png)");
        $("#view-bt-physical").css({"background-color": "#428bca", "color": "white"});
        $("#view-bt-physical2").css({"background-color": "#428bca", "color": "white"});
        // Remove Event
        $("#tools-bt-add-table").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#normal").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#parenting").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#sequence").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});

        $("#view-bt-physical").off("mouseover", mouseOverPhysical);
        $("#view-bt-physical").off("mouseout", mouseOutPhysical);
        $("#view-bt-physical2").off("mouseover", mouseOverPhysical);
        $("#view-bt-physical2").off("mouseout", mouseOutPhysical);
        $("#properties_container").css({"width": "0"});
        $("#mouseover_container").css("display", "none");
        $("#paper_container").css({"right": "5px", "width": window.innerWidth - 4});


        // Action
        $(".conceptual-container").css({"visibility": "visible"});

        if (graph !== null) { // Maybe this should be ignored, it seems weird from the user's point of view. Just keep the conceptual current scale and position
            // Sets the scale and point of origin of the physical diagram
            //paper.setOrigin( physical_origin["x"], physical_origin["y"] );
            //scale = physical_scale;
            //paper.scale(scale, scale);
        }
        // Create the physical diagram

        generate_physical_diagram(new_view);

        $(".tool-options").on("click", show_link_properties);


        if (!standardChanged)
            LogStatus("Switched to Physical View");

    }
    else if (new_view == 2) { // New view is the Scripts View


        // make the canvas occupy the whole monitor width
        document.getElementById("v-2").setAttribute("width", window.innerWidth);


        //$(".normalization-select").prop("disabled",true)
        $(".database-select").prop("disabled", true);

        $("#label-bt-export").html("Export Scripts (.txt)");
        $('#operations-bt-export').attr('data-target', '#modalTXT');

        $("#view-bt-scripts").css({"background-color": "#428bca", "color": "white"});
        $("#view-bt-scripts2").css({"background-color": "#428bca", "color": "white"});
        // Remove Event
        $("#view-bt-scripts").off("mouseover", mouseOverScripts);
        $("#view-bt-scripts").off("mouseout", mouseOutScripts);
        $("#view-bt-scripts2").off("mouseover", mouseOverScripts);
        $("#view-bt-scripts2").off("mouseout", mouseOutScripts);
        // Action
        $("#script_container").css({"visibility": "visible"});
        $("#tools-bt-add-table").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#normal").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#parenting").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#sequence").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $(".properties-container").css("display", "");
        $("#properties_container").css({"width": "0"});
        $("#mouseover_container").css("display", "none");
        $("#script_container").css({"right": "5px", "width": window.innerWidth - 4});

        // Create the script view
        generate();
        $("#script_text_container").text(script);

        if (!standardChanged)
            LogStatus("Script Generated");
    }
    else if (new_view == 3) {  // New view is the SQLEditor View
        $(".database-select").prop("disabled", true);

        $("#view-bt-SQLEditor").css({"background-color": "#428bca", "color": "white"});
        $("#view-bt-SQLEditor2").css({"background-color": "#428bca", "color": "white"});
        // Remove Event
        $("#view-bt-SQLEditor").off("mouseover", mouseOverSqlEditor);
        $("#view-bt-SQLEditor").off("mouseout", mouseOutSQLEditor);
        $("#view-bt-SQLEditor2").off("mouseover", mouseOverSqlEditor);
        $("#view-bt-SQLEditor2").off("mouseout", mouseOutSQLEditor);
        // Action
        $("#tools-bt-add-table").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#normal").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#parenting").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
        $("#sequence").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});

        $("#properties_container").css("display", "none");
        $("#mouseover_container").css("display", "none");
        $("#sql_editor_container").css({"visibility": "visible", "width": window.innerWidth - 13});
        $("#sql_editor_bar_button_request").css({"visibility": "visible"});
        $("#sql_editor_bar_button_clear").css({"visibility": "visible"});

        // $("#img-run-SQL-editor").css({"opacity": "1", "cursor": "default", "pointer-events": "none"});
        // $("#img-clear-SQL-result").css({"opacity": "1", "cursor": "default", "pointer-events": "none"});
        $("#run_SQL").attr("disabled", false);
        $("#clear_results").attr("disabled", false);
        $("#run_SQL").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
        $("#clear_results").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});

        $(function () { //to handle the vertical resize between query and result areas
            $("#sql_editor_text_container_div").resizable();
            $('#sql_editor_text_container_div').resize(function () {
                $('#sql_editor_results_container_div').height($("#sql_editor_container").height() - $("#sql_editor_text_container_div").height());
            });
            $(window).resize(function () {
                $('#sql_editor_results_container_div').height($("#sql_editor_container").height() - $("#sql_editor_text_container_div").height());
                $('#sql_editor_text_container_div').width($("#sql_editor_container").width());
            });
        });

        LogStatus("Switched to SQL Editor")
    }

    current_diagram = new_view;
}


/**
 * Receive normalization type ('true' == Normal; 'false' == Simplified). NB: parameter is string (not boolean)
 *
 * @param isNormal
 */
function changeNormalization(isNormal) {
    if (standard != isNormal) {
        standard = isNormal;

        if (current_diagram != 0) {
            switch_view(current_diagram, true, true);
        }

        if (isNormal == "true") {
            $("#dropbtn_title_select").html("Normal");
            $("#dropbtn_title_select-small").html("Normal");
        } else {
            $("#dropbtn_title_select").html("Simplified");
            $("#dropbtn_title_select-small").html("Simplified");
        }
    }
}

function mouseOverConceptual() {
    try {
        $("#view-bt-conceptual").css({
            "background-color": "#e7e7e7"
        });
    } catch (err) {
        call_error_dialog(err, "mouse over conceptual");
    }
}

function mouseOverPhysical() {
    try {
        $("#view-bt-physical").css({
            "background-color": "#e7e7e7"
        });
    } catch (err) {
        call_error_dialog(err, "mouse over physical");
    }
}

function mouseOverScripts() {
    try {
        $("#view-bt-scripts").css({
            "background-color": "#e7e7e7"
        });
    } catch (err) {
        call_error_dialog(err, "mouse over scripts");
    }
}

function mouseOverSqlEditor() {
    try {
        $("#view-bt-SQLEditor").css({
            "background-color": "#e7e7e7"
        });
    } catch (err) {
        call_error_dialog(err, "mouse over sql editor");
    }
}

function mouseOutConceptual() {
    try {
        $("#view-bt-conceptual").css({
            "background-color": "transparent"
        });
    } catch (err) {
        call_error_dialog(err, "mouse out conceptual");
    }
}

function mouseOutPhysical() {
    try {
        $("#view-bt-physical").css({
            "background-color": "transparent"
        });
    } catch (err) {
        call_error_dialog(err, "mouse out physical");
    }
}

function mouseOutScripts() {
    try {
        $("#view-bt-scripts").css({
            "background-color": "transparent"
        });
    } catch (err) {
        call_error_dialog(err, "mouse out scripts");
    }
}

function mouseOutSQLEditor() {
    try {
        $("#view-bt-SQLEditor").css({
            "background-color": "transparent"
        });
    } catch (err) {
        call_error_dialog(err, "mouse out sqleditor");
    }
}

/* ******************************************* */

/* Properties */
/**
 * Highlight selected table
 * @param t
 */
function highlight_table(t) {
    try {
        t.shape.attr(filter = {
            name: "class",
            "#shape-base": {
                "class": "shape_base_highlighted"
            }
        });
        isTableHighlighted = true;

    } catch (err) {
        call_error_dialog(err, "highlight table");
    }
}

/**
 * Highlight sequence
 * @param t
 */
function highlight_sequence(t) {
    try {
        t.shape.attr(filter = {
            name: "class",
            "#shape-base": {
                "class": "sequence_base_highlighted"
            }
        });
		isSequenceHighlighted = true;
    } catch (err) {
        call_error_dialog(err, "highlight sequence");
    }
}

/**
 * Remove highlight selected table
 * @param t
 */
function remove_table_highlight(t) {
    try {
        t.shape.attr(filter = {
            name: "class",
            "#shape-base": {
                "class": "shape_base"
            }
        });
        isTableHighlighted = false;
		isSequenceHighlighted = false;
    } catch (err) {
        call_error_dialog(err, "remove table highlight");
    }
}

/**
 * Highlight selected relation
 * @param t
 */
function highlight_relation(t) {
    try {
        t._link.attr(filter = {
            name: "class",
            ".connection": {
                "class": "connection link_base_highlighted"
            }
        });
        t._link.attr(filter = {
            name: "class",
            ".marker-source": {
                "class": "marker-source link_base_highlighted"
            }
        });
        t._link.attr(filter = {
            name: "class",
            ".marker-target": {
                "class": "marker-target link_base_highlighted"
            }
        });
    } catch (err) {
        call_error_dialog(err, "highlight relation");
    }
}

/**
 * Remove highlight selected relation
 * @param t
 */
function remove_relation_highlight(t) {
    try {
        if (t === null) {
            return;
        }
        t._link.attr(filter = {
            name: "class",
            ".connection": {
                "class": "connection"
            }
        });
        t._link.attr(filter = {
            name: "class",
            ".marker-source": {
                "class": "marker-source"
            }
        });
        t._link.attr(filter = {
            name: "class",
            ".marker-target": {
                "class": "marker-target"
            }
        });
    } catch (err) {
        call_error_dialog(err, "remove relation highlight");
    }
}

/**
 * Hide table properties
 */
function clear_table_properties_panel() {
    try {
        remove_relation_highlight(current_link);
        var table_name = $("#properties_table_name");
        if (table_name.length !== 0) {
            table_name.html("");
            $("#properties_fields").html("");
        }
        $("#properties_check_constraint").html("");
        $("#properties_link").html("");
        $("#properties_hierarchy").html("");
    } catch (err) {
        call_error_dialog(err, "clear table properties");
    }
}

/**
 * Show table properties
 * @param event
 * @param table
 * @param forceUpdate
 */
function show_table_properties(event, table, forceUpdate) {
    try {
        if ((table == current_table) && (forceUpdate !== true))
            return; // Does not change anything if the selected table is already the current one

        if (current_table !== null) {
            remove_table_highlight(current_table);
        }

        clear_table_properties_panel();
        current_table = table;
        if (current_link !== null) {
            current_link = null;
        }

        highlight_table(current_table);

        // Table Name
        var tablename = '<label style="margin-left: 3px">Entity Name</label>';
        tablename += '<input id="table-name-input" type="text" oninput="changing_table_name()" value="' + table.data.table_name + '">';
        tablename += '<button id="tools-delete-table" onclick="delete_table()" style="padding-left: 0px; margin-right: 9px"> <img src="icons/clear.png"> </button>';

        $("#properties_table_name").html(tablename);

        // Table Fields
        var tableProperties = '<table style="width: 100%">' +
            '<tr>' +
            '<th>Fields</th>' +
            '<th>' +
            '<div class="properties-add">' +
            '<button id="tools-add-field" onclick="add_new_field()">' +
            '<img src="icons/plus.png">' +
            '</button>' +
            '</div>' +
            '</th>' +
            '</tr>' +
            '</table>';

        // Add Each Field
        var length = table.data.fields.length;
        for (var i = 0; i < length; i++) {
            tableProperties += gen_field_html(i);
            //tableProperties += '<br>';
        }

        $("#properties_fields").html(tableProperties);


        // Check Constraint
        var check_constraint = '<table style="width: 100%; margin-top: 25px; margin-left: 2px">' +
            '<tr>' +
            '<th>Check Constraints</th>' +
            '<th>' +
            '<div class="properties-add" style="margin-right: 9px">' +
            '<button id="tools-add-field-checkConstraint" onclick="add_new_checkConstraint()" >' +
            '<img src="icons/plus.png">' +
            '</button>' +
            '</div>' +
            '</th>' +
            '</tr>';

        var length2 = table.data.checkName.length;
        for (var x = 0; x < length2; x++) {
            check_constraint += gen_checkConstraint_html(x);
        }

        $("#properties_check_constraint").html(check_constraint);

        // Highlight Table Name If Already Exists
        check_for_existing_tablename();

        LogStatus("Entity selected");
    } catch (err) {
        call_error_dialog(err, "show table properties");
    }
}

function add_new_checkConstraint() {
    try {
        // Add a new check constraint (name and condition)
        current_table.data.checkName[current_table.data.checkName.length] = "";
        current_table.data.checkCondition[current_table.data.checkCondition.length] = "";

        // Update html in Properties panel
        show_table_properties(null, current_table, true);

        LogStatus("Added new check constraint field");
    } catch (err) {
        call_error_dialog(err, "add new check constraint field");
    }
}

function gen_checkConstraint_html(i) {
    var checkInfo =
        '<th>' +
        '<div class="properties-check-constraint">' +
        '<tr><td> Name &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp <input id="properties-constraint-name_' + i + '" ' +
        ' type="text" oninput="check_constraint_fields(' + i + ')" value="' + (current_table.data.checkName[i] ? current_table.data.checkName[i] : ("constraint_" + i) ) + '" size="23" ' +
        'style="width: 163px">' +
        '<td><button style="margin-left: 6px" class="check-constraint-rest" id="check_constraint_rest" onclick="checkConstraint_reset(' + i + ')"><img src="icons/clear.png"/></button></td></tr>' +
        '<tr><td> Check</tr></td>' +
        //'<input id="properties-constraint-condition" type="text" oninput="check_constraint_fields()" value="' + table.data.checkCondition + '" size="1000" maxlength="1000"> </td></tr>' +
        '<tr><td> <textarea name="foo" id="properties-constraint-condition_' + i + '" placeholder="e.q, age >18 AND city=&#145Coimbra&#146" oninput="check_constraint_fields(' + i + ')" ' +
        'maxlength="1000" rows="3" cols="29" style="width: 88%">' + current_table.data.checkCondition[i] + '</textarea></td></tr>' +
        '</div>' +
        '</th>'
    '</table>'
    ;
    return checkInfo;
}

/**
 * Check constraint reset
 */
function checkConstraint_reset(i) {
    try {
        current_table.data.checkName.splice(i, 1);
        current_table.data.checkCondition.splice(i, 1);
        // Refresh table properties window
        show_table_properties(null, current_table, true);

        LogStatus("Check Constraint removed");
    } catch (err) {
        call_error_dialog(err, "remove check constraint");
    }
}

/**
 * Change table properties
 */
function changing_table_name() {
    try {
        current_table.data.table_name = $("#table-name-input").val();
        update_table_graph();
    } catch (err) {
        call_error_dialog(err, "changing table name");
    }
}

/**
 * Check constraint fields
 */
function check_constraint_fields(i) {
    try {
        // Content of Input field
        var check_name = $("#properties-constraint-name_" + i).val();
        var check_condition = $("#properties-constraint-condition_" + i).val();

        // Update data
        current_table.data.checkName[i] = check_name;
        current_table.data.checkCondition[i] = check_condition;

        LogStatus("Check Constraint Fields Updated");
    } catch (err) {
        call_error_dialog(err, "changing check constraint fields");
    }
}

/**
 * Change fields parameter
 * @param index
 * @param param
 */

function change_field_param(index, param) {
    try {
        if (param === 0) { // Is PK
            current_table.data.fields[index].isPK = !current_table.data.fields[index].isPK;
            if (current_table.data.fields[index].isPK == false) {
                $("#properties-not-null_" + index).prop('disabled', false);
                $("#properties-unique_" + index).prop('disabled', false);
                if (!current_table.data.fields[index].isNotNull) {
                    $("#properties-not-null_" + index).prop('checked', false);
                }
                if (!current_table.data.fields[index].isUnique) {
                    $("#properties-unique_" + index).prop('checked', false);
                }
            } else {
                $("#properties-not-null_" + index).prop('disabled', true);
                $("#properties-not-null_" + index).prop('checked', true);
                $("#properties-unique_" + index).prop('disabled', true);
                $("#properties-unique_" + index).prop('checked', true);
            }
        }
        else if (param == 1) // Is Not Null
            current_table.data.fields[index].isNotNull = !current_table.data.fields[index].isNotNull;
        else if (param == 2) // Is Unique
            current_table.data.fields[index].isUnique = !current_table.data.fields[index].isUnique;
        else if (param == 4) // Is auto increment
            current_table.data.fields[index].isAutoIncrement = !current_table.data.fields[index].isAutoIncrement;

        // Default
        else if (param == 3) {

            /*var types = [
                "Boolean", "SmallInt", "Integer",
                "BigInt", "Float", "Double Precision",
                "Number", "Date", "Timestamp", "Character",
                "Varchar", "Text", "Blob"
            ];

            var fieldTypeName = types[current_table.data.fields[index].fieldType];*/
            var getValue = $("#property_" + index).find("#properties_default").val();

            /*if (fieldTypeName == "Boolean") {
                if (getValue != "TRUE" || getValue != "true" || getValue != "FALSE" || getValue != "false") {
                    LogStatus("Boolean values can only be true or false.", true);
                }
            }*/

            //console.log(getValue);
            //if (field_validation(index, getValue) === true) {
            current_table.data.fields[index].defaultValue = getValue;
            //} else {
            //LogStatus("you 're dumb!!!!!", true);
            //}
        }


        update_table_graph();

        LogStatus("Changed field parameter");
    } catch (err) {
        call_error_dialog(err, "change field parameter");
    }
}


/**
 * Change field type
 * @param index
 */
function change_field_type(index) {
    try {
        current_table.data.fields[index].fieldType = $("#property_" + index).parent().find("select")[0].selectedIndex;
        current_table.data.fields[index].args = defaultValues[current_table.data.fields[index].fieldType];

        if (!isIntegerField(($("#property_" + index).parent().find("select")[0].value)))
            current_table.data.fields[index].isAutoIncrement = false;

        update_table_graph();
        show_table_properties(null, current_table, true);
        toggle_fold(index);

        LogStatus("Changed field type");
    } catch (err) {
        call_error_dialog(err, "change field type");
    }
}

/**
 * Change field name
 * @param index
 */
function changing_field_name(index) {
    try {
        current_table.data.fields[index].fieldName = $('#properties_field_' + index).val();
        update_table_graph();

        LogStatus("Field name updated");
    } catch (err) {
        call_error_dialog(err, "change field namee");
    }
}


/**
 * Change field argument
 * @param i
 * @param j
 */
function change_field_arg(i, j) {
    try {
        var getValue = undefined;
        var numField1 = undefined;
        var numField2 = undefined;

        var types = [
            "Boolean", "SmallInt", "Integer",
            "BigInt", "Float", "Double Precision",
            "Number", "Date", "Timestamp", "Character",
            "Varchar", "Text", "Blob"
        ];

        var fieldTypeName = types[current_table.data.fields[i].fieldType];


        if (fieldTypeName != "Number") {
            getValue = $("#property_" + i).find("#field_" + i + "arg_" + j).val();
            if (getValue == "") {
                current_table.data.fields[i].args = "";
            } else {
                current_table.data.fields[i].args = getValue;
            }
        } else {
            //  Number is special case because we have 2 fields
            numField1 = $("#property_" + i).find("#field_" + i + "arg_" + 0).val(); // get scale value
            numField2 = $("#property_" + i).find("#field_" + i + "arg_" + 1).val(); // get precision value


            current_table.data.fields[i].args = numField1 + "@@@" + numField2;
        }

        update_table_graph();

    } catch (err) {
        call_error_dialog(err, "change field arg");
    }
}

function perform_field_click(i) {
    toggle_fold(i);
    document.getElementById("properties_field_" + i).setAttribute("onclick","");
    setTimeout(function () {
        document.getElementById("properties_field_" + i).setAttribute("onclick","perform_field_click("+ i + ")");
    },600);
}

/**
 * Generate Code to Display a Table Field
 * @param i
 * @returns {string}
 */
function gen_field_html(i) {
    try {
        var types = [
            "Boolean", "SmallInt", "Integer",
            "BigInt", "Float", "Double Precision",
            "Number", "Date", "Timestamp", "Character",
            "Varchar", "Text", "Blob"
        ];


        // Column With The Name
        var field = current_table.data.fields[i];

        // auto increment option only makes sense for integer types
        // Oracle does not support auto increment
        //var showAutoIncrement = (db_chosen != 'Oracle') && isIntegerField(scripts["Default"]["types_bd"][field.fieldType]);
        var showAutoIncrement = isIntegerField(scripts[db_chosen]["types_bd"][field.fieldType]);
        var field_name = '<table class="properties-view-fields"><tr>';

        // TODO Logic - Drag and Drop handler icon
        //field_name += '<td><button class="properties-view-drag-drop" id="drag_drop_handler" onclick="hideInfo()"><img src="icons/drag.png"/></button> </td>';

        field_name += '<td><input id="properties_field_' + i + '" class="' +
            '" type="text" value="' + field.fieldName + '" size="10" ' +
            'oninput="changing_field_name(' + i + ')" onclick="perform_field_click(' + i + ')" style="width: 122px"/>&nbsp';

        // Type is Visible Too
        field_name += '<select id="field_types" onchange="change_field_type(' + i + ')" style="height: 23px; width: 118px; margin-left: 1px">';
        for (var t = 0; t < scripts[db_chosen]["types_bd"].length; t++) {
            field_name += '<option id="field-type-js-' + t + '" class="field-type-js" alt="' + scripts[db_chosen]["types_desc"][t] + '" title="' + scripts[db_chosen]["types_desc"][t] + '" value="' + scripts[db_chosen]["types_bd"][t] + '" ';

            if (t == field.fieldType)
                field_name += 'selected';

            field_name += '>' + scripts[db_chosen]["types_bd"][t] + '</option>';
            //field_name += '<span id="hover-field-type-js-'+t+'" hidden>'+ scripts[db_chosen]["types_desc"][t] + '</span>';
        }
        field_name += '</select></td>';

        // Fold/Unfold Icon
        //field_name += '<td><button class="properties-view-fold" id="property_show_' + i + '" onclick="toggle_fold(' + i + ')"><img src="' + field_closed_icon + '"/></button> </td>';

        var up = "up";
        var down = "down";
        field_name += '<td><button id="changeFieldToUp" onclick="changeFieldPositionUp(' + i + ')" style="margin-right: 2px"><img class="properties-up" src="' + fieldChangeUp + '"/></button> </td>';
        field_name += '<td><button id="changeFieldToDown" onclick="changeFieldPositionDown(' + i + ')" style="margin-right: 2px"><img class="properties-down" src="' + fieldChangeDown + '"/></button> </td>';

        // Remove Field Button
        field_name += '<td><button id="property_remove_' + i + '" onclick="remove_field(' + i + ')"><img src="icons/clear.png"/></button> </td>';
        field_name += '</tr></table>';

        // Field Properties
        var field_properties = '<form id="property_' + i + '" style="display: none;" folded="true"><table>';

        // Arguments
        var typeUsed = types[field.fieldType];

        var splitArgs = undefined;
        var toShow = undefined;

        var allowNumbers = "onkeypress='return ((event.charCode >= 48 && event.charCode <= 57) || (event.charCode == 8 || event.which === 8);'";
        var allowLetters = "onkeypress='return ((event.charCode >= 65 && event.charCode <= 90)";
        allowLetters += " || (event.charCode >= 97 && event.charCode <= 122) || (event.charCode == 8 || event.which === 8);'"; // a-z A-Z

        //alert("--->"+types[field.fieldType]);

        // Default Value
        // MariaDB : ERROR 1101 (42000): BLOB/TEXT column can't have a default value
        if (db_chosen == "MariaDB" && ( typeUsed == "Text" || typeUsed == "Blob")) {
        }
        /*if (db_chosen == "MariaDB" && (typeUsed == "Text") && (field.isPK || field.isUnique)) {
            field_properties += "</table></form>";
            field_properties += '</table>';
        }*/
        else {

            field_properties += '<table> <tr> <td> <div class="align_cell_left"> Default Value';

            if ((typeUsed == "SmallInt" || typeUsed == "Integer" || typeUsed == "BigInt" || typeUsed == "Number")) {
                field_properties += '</div> <div class="align_cell_right"> <input id="properties_default" class="properties-default" type="text"' + allowNumbers;
            } else {
                field_properties += '</div> <div class="align_cell_right"> <input id="properties_default" class="properties-default" type="text"';
            }

            field_properties += 'value="' + field.defaultValue + '" size="8" oninput="change_field_param(' + i + ', 3 )"> </div> </td></tr>';

        }

        for (var j = 0; j < scripts["Default"]["script_nargs"][field.fieldType]; ++j) {

            field_properties += '<tr> <td> <div class="align_cell_left">' + scripts["Default"]["nargs_text"][field.fieldType][j];

            if (typeUsed == "Number") {

                splitArgs = "" + field.args;

                if (splitArgs.indexOf("@@@") === -1) {
                    toShow = "" + field.args;
                    toShow = toShow.split(",");
                } else {
                    splitArgs = splitArgs.split("@@@");
                    toShow = splitArgs;
                }

                field_properties += '</div> <div class="align_cell_right">'
                field_properties += '<input id="field_' + i + 'arg_' + j + '" class="properties-arg" type="text"' + allowNumbers + 'value="' + toShow[j];

            } else {
                field_properties += '</div> <div class="align_cell_right"><input id="field_' + i + 'arg_' + j + '" class="properties-arg" type="text"' + allowNumbers + 'value="' + field.args;
            }

            field_properties += '" size=8 oninput="change_field_arg(' + i + ',' + j + ')"> </div> </td></tr>';
        }

        // Is PK
        field_properties += '<tr> <td> <div class="align_cell_left"> Primary Key </div> ' +
            '<div class="align_cell_right"><input id="properties-pk' + i + '" class="properties-pk" type="checkbox" value="pk" onclick="change_field_param(' + i + ', 0 )"';
        if (field.isPK) field_properties += 'checked ';
        field_properties += '> </div> </td> </tr>';

        // Is Not Null
        field_properties += '<tr> <td> <div class="align_cell_left"> Not NULL </div> ' +
            '<div class="align_cell_right"><input id="properties-not-null_' + i + '" class="properties-not-null" type="checkbox" value="not-null" onclick="change_field_param(' + i + ', 1 )"';
        if (field.isPK)
            field_properties += 'checked disabled';
        else if (field.isNotNull)
            field_properties += 'checked ';
        field_properties += '> </div> </td> </tr>';

        // Is Unique
        field_properties += '<tr> <td> <div class="align_cell_left"> Unique </div> ' +
            '<div class="align_cell_right"><input id="properties-unique_' + i + '" class="properties-unique" type="checkbox" value="unique" onclick="change_field_param(' + i + ', 2 )" ';
        if (field.isPK)
            field_properties += 'checked disabled';
        else if (field.isUnique)
            field_properties += 'checked ';
        //field_properties += '>Is Unique</td></tr></table>';
        field_properties += '> </div> </td> </tr>';

        // Auto Increment
        if (showAutoIncrement) {
            field_properties += '<tr> <td> <div class="align_cell_left"> Auto Increment </div> ' +
                '<div class="align_cell_right"><input id="properties-increment_' + i + '" class="properties-increment" type="checkbox" value="increment" onclick="change_field_param(' + i + ',4)"';
            if (field.isAutoIncrement) {
                field_properties += 'checked';
            }
            //field_properties += '> Auto Increment</td></tr></table>';
            field_properties += '> </div> </td> </tr>';
        }


        field_properties += "</table></form>";
        //  Close this table
        field_properties += '</table>';

        return '<div class="properties-field">' + field_name + field_properties + '</div>';

    } catch (err) {
        call_error_dialog(err, "generate field html");
    }
}

/**
 * Change field position up
 * @param actualPosition
 */
function changeFieldPositionUp(actualPosition) {
    try {
        if (actualPosition == 0) {
            $("#changeFieldToUp").attr("disabled", true);
        } else {
            if ($("#changeFieldToUp").click) {
                var temp = current_table.data.fields[actualPosition - 1];
                current_table.data.fields[actualPosition - 1] = current_table.data.fields[actualPosition];
                current_table.data.fields[actualPosition] = temp;
                update_table_graph(current_table);
                show_table_properties(null, current_table, true);
            }
        }
        LogStatus("Field Change Position");
    } catch (err) {
        call_error_dialog(err, "change field up");
    }
}

/**
 * Change field position down
 * @param actualPosition
 */
function changeFieldPositionDown(actualPosition) {
    try {
        if (actualPosition == current_table.data.fields.length - 1) {
            $("#changeFieldToDown").attr("disabled", true);
        } else {
            if ($("#changeFieldToDown").click) {
                var temp = current_table.data.fields[actualPosition];
                current_table.data.fields[actualPosition] = current_table.data.fields[actualPosition + 1];
                current_table.data.fields[actualPosition + 1] = temp;
                update_table_graph(current_table);
                show_table_properties(null, current_table, true);
            }
        }
        LogStatus("Field Change Position");
    } catch (err) {
        call_error_dialog(err, "change field up");
    }
}

/**
 * Toggle or untoggle fold
 * @param i
 */
function toggle_fold(i) {
    try {



        var prop = $("#property_" + i);

        if (prop.attr("folded") == 'true') {
            for (var j = current_table.data.fields.length - 1; j >= 0; j--) {
                var temp_prop = $("#property_" + j);
                if (temp_prop.attr("folded") == 'false') {
                    toggle_fold_close(temp_prop, j);
                    break; // Since there is only one opened field, it is safe to stop once we find one (a.k.a. THE) opened field
                }
            }

            toggle_fold_open(prop, i);
        } else {
            toggle_fold_close(prop, i);
        }
    } catch (err) {
        call_error_dialog(err, "toggle fold");
    }
}

/**
 * Untoggle fold
 * @param prop
 * @param i
 */
function toggle_fold_close(prop, i) {
    try {

        prop.slideUp(100);
        prop.attr("folded", "true");
        prop.parent().children("table").find("#property_show_" + i).find("img").attr("src", field_closed_icon);
    } catch (err) {
        call_error_dialog(err, "toggle fold close");
    }
}

/**
 * Toggle Fold
 * @param prop
 * @param i
 */
function toggle_fold_open(prop, i) {
    try {

        prop.slideDown(100);
        prop.attr("folded", "false");
        prop.parent().children("table").find("#property_show_" + i).find("img").attr("src", field_opened_icon);
    } catch (err) {
        call_error_dialog(err, "toggle fold open");
    }
}

/* ******************************************* */

/* Info */

/**
 * Show info
 */
function showInfo() {
    try {
        $("#info-container")[0].className = "show";
    } catch (err) {
        call_error_dialog(err, "show information");
    }
}

/**
 * Hide info
 */
function hideInfo() {
    try {
        $("#info-container")[0].className = "hidden";
    } catch (err) {
        call_error_dialog(err, "hide information");
    }

}


/* ******************************************* */

/* Table management */

/**
 * Create new table
 */
function create_new_table() {
    try {
        if (current_table !== null) {
            remove_table_highlight(current_table);
        }

        clear_table_properties_panel();

        ENTITY_ID++;


        var x = -paper.options.origin.x * (1 / scale);
        var y = -paper.options.origin.y * (1 / scale);

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

        var tbl = create_sql_table(graph, x, y, "Entity_" + ENTITY_ID, [
            new SQL_Field("field_0", DEFAULT_FIELD_TYPE, true, false)
        ]);
        conceptual_tables_list.push(tbl);

        show_table_properties(null, tbl, null);


        LogStatus("Entity created");
    } catch (err) {
        call_error_dialog(err, "create new table");
    }
}

/**
 * Delete table
 * @param id
 */
function delete_table(id) {
    try {
        var cid;

        if (id)
            cid = id;
        else
            cid = current_table.shape.cid;

        for (var i = 0; i < conceptual_links_list.length; i++) {
            var l = conceptual_links_list[i];

            if (l._source.id == current_table.shape.id || l._target.id == current_table.shape.id) {
                current_link = l;
                remove_link(l);
            }
        }

        var c = graph.getCell(cid);
        conceptual_tables_list.splice(conceptual_tables_list.indexOf(current_table), 1);
        c.remove();
        remove_table_highlight(current_table);
        clear_table_properties_panel();

        current_table = null;
        current_link = null;

        LogStatus("Entity deleted");
    } catch (err) {
        call_error_dialog(err, "delete table");
    }
}

/* ******************************************* */

/* Tables Relation Management */

/**
 * Remove link from table
 * @param id
 */
function remove_link(id) {
    try {
        // só no diagrama conceptual se podem remover relações
        if (current_diagram === 0) {
            for (i = conceptual_links_list.length - 1; i >= 0; i--) {
                if (current_link && current_link._link.id == conceptual_links_list[i]._link.id) {

                    if (current_link._sourceisweak)
                        update_weak_entities_after_delete(getTableWithID(current_link._source.id));
                    else if (current_link._targetisweak)
                        update_weak_entities_after_delete(getTableWithID(current_link._target.id));

                    conceptual_links_list.splice(i, 1);
                    current_link._link.remove();
                    current_link = null;
                    clear_table_properties_panel();

                    return;
                }
            }

            var graph_links = graph.getLinks();

            var i = 0, j = 0;
            var exists = false;
            for (i = conceptual_links_list.length - 1; i >= 0; i--) {
                exists = false;
                for (j = graph_links.length - 1; j >= 0; j--) {
                    if (conceptual_links_list[i]._link.id === graph_links[j].id) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    conceptual_links_list.splice(i, 1); // Removes 1 element starting at i

                    
                    return;
                }
            }
			LogStatus("Removed relation");
        }
    } catch (err) {
        call_error_dialog(err, "remove links");
    }
}

/**
 * Generate field names
 * @param fields
 * @param physical
 * @returns {Array}
 */
function generate_fieldnames(fields, physical) {
    try {
        var fieldNames = [];
        var flength = fields.length;
        var dataTypes, biggestTypeName, fieldType;

        // data types to present
        physical ? dataTypes = scripts[db_chosen]["types_abrev"] : dataTypes = scripts["Default"]["types_abrev"];

        // for shape purposes
        var types = dataTypes.slice();
        biggestTypeName = types.sort(function (a, b) {
            return b.length - a.length;
        })[0];
        campos = "";

        for (var j = 0; j < flength; j++) {

            if (physical)
            {
                fieldNames.push(fields[j].fieldName.toLowerCase());
                campos+= '<br/>'+ fields[j].fieldName;
            }
            else
            {
                fieldNames.push(fields[j].fieldName);
                campos+= '<br/>'+ fields[j].fieldName;
            }


            if (fieldNames[j].length > MAX_FIELD_CHARS) {
                aux = true;
                fieldNames[j] = fieldNames[j].substring(0, MAX_FIELD_CHARS - 1) + "..";
            }

            for (var k = fieldNames[j].length; k < MAX_FIELD_CHARS + 1; k++) {
                fieldNames[j] += " ";
            }

            // sequence
            if (fields[j].value !== undefined) {
                fieldNames[j] += fields[j].value;
            }

            // sequence tables have no types in fields
            if (dataTypes[fields[j].fieldType]) {
                fieldType = dataTypes[fields[j].fieldType];
                fieldNames[j] += fieldType + " ";

                for (var k = fieldType.length; k < biggestTypeName.length; k++) {
                    fieldNames[j] += " ";
                }
            }

            if (fields[j].isPK) fieldNames[j] += "PK ";
            else fieldNames[j] += "   ";

            if (physical === true) {
                if (fields[j].isFK) fieldNames[j] += "FK ";
                else fieldNames[j] += "   ";
            }

            if (fields[j].isNotNull) fieldNames[j] += "NN ";
            else fieldNames[j] += "   ";

            if (fields[j].isUnique) fieldNames[j] += "UN ";
            else fieldNames[j] += "   ";

            if (fields[j].isAutoIncrement) fieldNames[j] += "AU";
            else fieldNames[j] += "   ";
        }

        return fieldNames;

    } catch (err) {
        call_error_dialog(err, "generate field names");
    }
}

/**
 * Update table
 * @param table
 * @param physical
 */
 var entidade;
function update_table_graph(table, physical) {
    try {
        if (table === undefined)
            table = current_table;

        if (physical === undefined)
            physical = false;

        var nFields = table.data.fields.length;
        var new_fields = table.shape.attr('#fields');
        entidade = "";

        aux=false;

        new_fields.text = "";

        if (table.data.sequence) {
            var f = table.data.fields;
            var f2 = [];

            for (var i = 0; i < f.length; i++) {
                if (f[i].value !== undefined && f[i].value !== "" && f[i].fieldName != "No Cache")
                    f2.push(f[i]);
                else
                    nFields--;
            }

            fields = generate_fieldnames(f2, physical);
        }
        else
            fields = generate_fieldnames(table.data.fields, physical);


        for (var i = 0; i < fields.length; i++) {
            if (new_fields.text === "") {
                new_fields.text = fields[i];

            }
            else {
                new_fields.text += "\n" + fields[i];

            }
        }
        // Positions 󰀀 of title, line and fields
        var blockH = titleHeight + (nFields) * fieldHeight + 4 * shapeMargin;

        // Line position (Y): Default block height is 100, and it is gonna be scaled to match h. So line y is relative to default height (100)
        var lineY = ((titleHeight + shapeMargin * 2) / blockH) * 100;

        // Text position (Y): is set as percentage (between 0 and 1), so it is 1/totalLines
        var fieldsY = (titleHeight + shapeMargin * 3) / blockH;
        var titleY = shapeMargin / blockH;

        // Set new value
        new_fields["ref-y"] = fieldsY;              // Update Y
        table.shape.attr('#fields', ""); // clear the value
        table.shape.attr('#fields', new_fields);

        // Set title position
        table_title = table.shape.attr('#title');
        table_title["ref-y"] = titleY;
        table.shape.attr('#title', "");  // clear the value

        var tle = table.data.table_name;
        entidade = tle;
        if (tle.length > MAX_TITLE_CHARS) // Clamp Title
        {
            aux = true;
            entidade = tle;
            tle = tle.substring(0, MAX_TITLE_CHARS - 1) + ".." ;
        }

        if (physical)
            table_title["text"] = tle.toLowerCase();
        else
            table_title["text"] = tle;

        table.shape.attr('#title', table_title);

        // Set line position
        table_divisor = table.shape.attr('line');
        table_divisor["y1"] = lineY;
        table_divisor["y2"] = lineY;
        table.shape.attr('line', ""); // clear the value
        table.shape.attr('line', table_divisor);

        // Resize shape
        var w = table.shape.attributes.size.width;
        var h = blockH;
        table.shape.resize(w, h);
        if (aux == true)
        {
            table.shape.attr('title/text',entidade+"\n"+campos);
        }
        else {
            table.shape.attr('title/text', "");
        }
    } catch (err) {
        call_error_dialog(err, "update table graph");
    }
}

/* ******************************************* */

/* Field Management */

/**
 * Add new field
 */
function add_new_field() {
    try {
        var default_name = "field_" + (current_table.data.next_id++);

        // Current table
        current_table.data.fields.push(new SQL_Field(default_name, 0, false, false));

        // Update table in graph
        update_table_graph();

        // Update html in Properties panel
        show_table_properties(null, current_table, true);

        LogStatus("Added new field");
    } catch (err) {
        call_error_dialog(err, "add new field");
    }
}

/**
 * Remove field
 * @param index
 */
function remove_field(index) {
    try {
        f = current_table.data.fields.splice(index, 1);
        update_table_graph();
        show_table_properties(null, current_table, true);

        LogStatus("Field removed");
    } catch (err) {
        call_error_dialog(err, "remove field");
    }
}

/* ******************************************* */

/* Shape Management */

/**
 * Create shape
 * @param _x
 * @param _y
 * @param title
 * @param fields
 * @param sequence
 * @param physical
 * @returns {*}
 */
function createShape(_x, _y, title, fields, sequence, physical) {
    try {
        var nFields = fields.length;
        // because sequences and stuff
        /*if ( sequence && nFields < 5 )
         nFields = 5;*/
        // Block Height: (nFields+1)* singleLineHeight    -> (nFields+1 because it's n entries + table name)
        var blockH = titleHeight + (nFields) * fieldHeight + 4 * shapeMargin;
        var lineY = ((titleHeight + shapeMargin * 2) / blockH) * 100;
        // Text position (Y): is set as percentage (between 0 and 1), so it is 1/totalLines
        var fieldsY = (titleHeight + shapeMargin * 3) / blockH;
        var titleY = shapeMargin / blockH;
        var width;
        var _text = "";
        var length = fields.length;
        for (var i = 0; i < length; i++) {
            _text += "\n" + fields[i];
        }
        if (_text !== "") {
            _text = _text.substring(1);
        }
        if (physical) {
            width = physicalWidth;
        } else {
            width = shapeWidth;
        }
        if (sequence) {
            return new joint.shapes.basic.Conceptual_TableElement({
                position: {
                    x: _x,
                    y: _y
                },
                size: {
                    width: sequenceWidth,
                    height: blockH
                },
                attrs: {
                    "#title": {
                        text: title,
                        'ref-y': titleY
                    },
                    "#fields": {
                        text: _text,
                        'ref-y': fieldsY
                    },
                    line: {
                        y1: titleHeight + 5,
                        y2: titleHeight + 5
                    },
                    rect: {
                        fill: TABLE_COLOR.SEQUENCE
                    }
                }
            });
        } else {
            return new joint.shapes.basic.Conceptual_TableElement({
                position: {
                    x: _x,
                    y: _y
                },
                size: {
                    width: width,
                    height: blockH
                },
                attrs: {
                    title: {text: title},
                    "#title": {
                        text: title,
                        'ref-y': titleY
                    },

                    "#fields": {
                        text: _text,
                        'ref-y': fieldsY
                    },
                    line: {
                        y1: lineY,
                        y2: lineY
                    },
                    rect: {
                        fill: TABLE_COLOR.ENTITY
                    }
                }
            });
        }
    } catch (err) {
        call_error_dialog(err, "create shape");
    }
}

/**
 * Enable main events
 * @param ignore_joint_event
 */
function enable_main_events(ignore_joint_event) {
    try {
        if (ignore_joint_event !== true) {
            // Reactivate Joint events of the paper
            var events_list = ["click", "dblclick", "mousedown", "mousemove", "touchmove", "touchstart"];
            for (var i = events_list.length - 1; i >= 0; i--) {
                $("#paper_container").on(events_list[i], events_backup[events_list[i]]);
            }
            events_backup = null;
            // Reactivate paper drag
            canvas.on('mousedown', canvas_mouseDown_trigger); // Enable canvas drag
            canvas.on('touchstart', canvas_touchStart_trigger); // Enable canvas drag

            var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";

            if (mousewheelevt == "DOMMouseScroll") {
                canvas.on("DOMMouseScroll", canvas_mouseWheel_trigger);
            } else {
                canvas.on("mousewheel", canvas_mouseWheel_trigger); // Enable canvas scale via mouse wheel
            }

            //canvas.on("mousewheel", canvas_mouseWheel_trigger); // Enable canvas scale via mouse wheel
        }
        // Reactivate custom events of tables
        //$('.shape_base_aux').off("mousedown");
        var rects_top_layers = $('.shape_base_aux');
        var length = conceptual_tables_list.length;
        for (var i = 0; i < length; i++) {
            for (var j = 0; j < length; j++) {
                if ($(rects_top_layers[i]).parent().parent().parent().attr("model-id") == conceptual_tables_list[j].shape.id) {
                    if (conceptual_tables_list[j].data.sequence) {
                        $(rects_top_layers[i]).on("mousedown", show_sequence_properties.bind(null, null, conceptual_tables_list[j]));
                        $(rects_top_layers[i]).on("touchstart", show_sequence_properties.bind(null, null, conceptual_tables_list[j]));
                        $(rects_top_layers[i]).on("touchmove", show_sequence_properties.bind(null, null, conceptual_tables_list[j]));
                    } else {
                        $(rects_top_layers[i]).on("mousedown", show_table_properties.bind(null, null, conceptual_tables_list[j]));
                        $(rects_top_layers[i]).on("touchstart", show_table_properties.bind(null, null, conceptual_tables_list[j]));
                        $(rects_top_layers[i]).on("touchmove", show_table_properties.bind(null, null, conceptual_tables_list[j]));
                    }
                    break;
                }
            }
        }
        // Enable toolbar buttons
        $('.operations_buttons').attr("disabled", false);
    } catch (err) {
        call_error_dialog(err, "enable main events");
    }
}

/**
 * Disable main events
 */
function disable_main_events() {

    try {
        // Clear table properties
        if (current_table !== null) {
            remove_table_highlight(current_table);
            current_table = null;
        }
        clear_table_properties_panel();

        // Get Joint events of the paper
        var paper_events = $._data($("#paper_container").get(0), "events");

        // Store the handlers of the Joint events
        events_backup = {};
        events_backup["click"] = paper_events.click[0];
        events_backup["dblclick"] = paper_events.dblclick[0];
        events_backup["mousedown"] = paper_events.mousedown[0];
        events_backup["mousemove"] = paper_events.mousemove[0];
        events_backup["touchmove"] = paper_events.touchmove[0];
        events_backup["touchstart"] = paper_events.touchstart[0];

        // Remove Joint events of the paper
        var events_list = [
            "click", "dblclick", "mousedown", "mousemove", "touchmove", "touchstart"
        ];
        for (var i = events_list.length - 1; i >= 0; i--) {
            $("#paper_container").off(events_list[i]);
        }

        // Remove custom events of tables
        $('.shape_base_aux').off("mousedown");
        $('.shape_base_aux').off("touchstart");
        $('.shape_base_aux').off("touchmove");

        // Disable paper drag
        canvas.off('mousedown');          // Disable canvas drag
        canvas.off('touchstart');          // Disable canvas drag
        canvas.off("mousewheel");         // Disable canvas scale via mouse wheel

        // Disable toolbar buttons
        $('.operations_buttons').attr("disabled", true);
    } catch (err) {
        call_error_dialog(err, "disable main events");
    }
}

/**
 * Create tables relation
 */
function create_tables_relation() {
    try {
        var relation = new_relation["id"];
        var relation_valid = true;
        var hiertype = null;

        //Check if already exist a link between these tables
        for (var i = conceptual_links_list.length - 1; i >= 0; i--) {
            if ((conceptual_links_list[i]._source.id == new_relation["source"].shape.id) &&
                (conceptual_links_list[i]._target.id == new_relation["target"].shape.id) &&
                new_relation["id"] != "normal") {
                relation_valid = false;
                LogStatus("Error: There already exists an inheritance relation between those entities", true);
                break;
            }
        }

        //try to do parenting relations
        if (new_relation["id"] == "parenting" && relation_valid) {
            LogStatus("Start a parenting relation");

            //It is a parent relation between the same table.. it can not happen
            if (new_relation["source"].shape.id == new_relation["target"].shape.id) {
                relation_valid = false;
                LogStatus("Error: A entity cannot inherit from itself", true);
            }

            // do not allow multiple inheritance (yet)
            else if (entity_has_parent_relation(new_relation["source"])) {
                relation_valid = false;
                LogStatus("Error: Entity cannot inherit from two parents", true);
            }

            //It is a parent relations valid, so it needs be validated because of cycles
            else {
                relation_valid = check_parenting_restrictions();

                if (relation_valid) {
                    // obter o tipo de hierarquia (complete por defeito)
                    hiertype = get_inheritance_type(new_relation["target"]);
                }

                else
                    LogStatus("Error: Detected cycle in inheritance", true);
            }
        }

        if (relation_valid) {
            addNewLink(
                new_relation["source"].shape,
                new_relation["target"].shape,
                relation,
                hiertype, "0:1", "0:1",
                new_relation["isSoft"], false, false, true
            );
            LogStatus("Relation created");
        }

        //Reset at global variables
        var id = new_relation["id"];
        var isSoft = new_relation["isSoft"];
        new_relation = null;

        setup_table_relation(id, isSoft); // this is to change the state machine to default
        $(".tool-remove").on("click", remove_link);
    } catch (err) {
        call_error_dialog(err, "create tables reation");
    }
}

/**
 * Add new link between tables
 * @param source
 * @param target
 * @param relation
 * @param hierType
 * @param sourceCard
 * @param targetCard
 * @param isSoft
 * @param sourceisweak
 * @param targetisweak
 * @param isShowLinkProperties
 */
function addNewLink(source, target, relation, hierType, sourceCard, targetCard, isSoft,
                    sourceisweak, targetisweak, isShowLinkProperties) {
    // Create link, add to graph and setup event. Note: source and target are shapes

    try {

        if (isShowLinkProperties == undefined) isShowLinkProperties = false;

        var l = createLink(source, target, relation, hierType, sourceCard, targetCard, isSoft, sourceisweak, targetisweak);
        graph.addCell(l);

        if (isShowLinkProperties === true) {
            show_link_properties(null, l.id);
        }

        $(".tool-options").off("click");
        $(".tool-options").on("click", show_link_properties);
    } catch (err) {
        call_error_dialog(err, "add new link");
    }
}

var new_relation = null;

/**
 * Add table to relation
 * @param e
 * @param shape
 */
function add_table_to_relation(e, shape) {
    try {
        eshape = shape;
        var index;

        //Get the index of the table on the conceptual_tables_list that will be selected
        for (var i = conceptual_tables_list.length - 1; i >= 0; i--) {
            //if( shape == $(conceptual_tables_list[i].rect).find(".shape_base_aux")[0] ){
            if ($(shape).parent().parent().parent().attr("model-id") == conceptual_tables_list[i].shape.id) {
                index = i;
                break;
            }
        }

        if (tableIsSequence(conceptual_tables_list[index])) {
            LogStatus("Error: Cannot create relations with sequences", true);

            if (current_state == 1)
                setup_table_relation(new_relation["id"]);

            return;
        }

        //It is the table that will be start the relation (first part of the new_relation === undefined)
        if (new_relation["source"] === undefined) {
            new_relation["source"] = conceptual_tables_list[index];
            highlight_table(conceptual_tables_list[index]);  //remove_table_highlight(shape);

            LogStatus("Entity selected for a new relation");
        }

        //Here the second table is selected to try create the relation
        // (this selected on a second round with the index of the target table already)
        else {
            LogStatus("Second entity selected");
            remove_table_highlight(new_relation["source"]);
            new_relation["target"] = conceptual_tables_list[index];

            LogStatus("Creating new " + new_relation["id"] + " relation");

            create_tables_relation();
        }
    } catch (err) {
        call_error_dialog(err, "add table to relation");
    }
}

var events_backup = null;

/**
 * Setup table relation
 * @param id
 * @param isSoft
 */
function setup_table_relation(id, isSoft) {
    try {
        var id_sufix = "";
        if (isSoft) id_sufix = "-s";

        //Current_state 0 means that the parenting button is selected (prepared to create a new relation)
        if (current_state === 0) {
            LogStatus("Creating a new entities relation");

            current_state = 1;

            // Disable all events
            disable_main_events();

            $(".table_relation").attr("disabled", true);
            $("#sequence").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#normal").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#parenting").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $("#" + id + id_sufix)[0].innerHTML = '<img src="icons/clear.png"/>';
            $("#" + id + id_sufix).attr("disabled", false);
            $("#" + id + id_sufix).off("click");
            $("#" + id + id_sufix).css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#tools-bt-add-table").attr("disabled", true);
            $("#tools-bt-add-table").css({"opacity": "0.4", "cursor": "default", "pointer-events": "none"});
            $(".view-container-switches").attr("disabled", true);
            $(".database-container").find("select").attr("disabled", true);

            var shapes = $(".shape_base_aux");

            new_relation = {};
            new_relation["id"] = id;

            for (var i = shapes.length - 1; i >= 0; i--) {
                $(shapes[i]).on("click", add_table_to_relation.bind(null, null, shapes[i]));

                LogStatus("Waiting for entities to be related...")
            }

            if (isSoft === true) {
                new_relation["isSoft"] = true;
            }
        }
        //Current_state 1 means that user disable the parenting button
        else if (current_state == 1) {
            current_state = 0;

            enable_main_events();

            //$("#" + id + id_sufix ).text( id + id_sufix );
            var iconPath = '<img src="icons/' + $("#" + id + id_sufix).attr("defaultIcon") + '.png">';
            $("#" + id + id_sufix).html(iconPath);

            $(".table_relation").attr("disabled", false);
            $("#normal").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#sequence").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#parenting").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $("#tools-bt-add-table").attr("disabled", false);
            $("#tools-bt-add-table").css({"opacity": "1", "cursor": "default", "pointer-events": "all"});
            $(".view-container-switches").attr("disabled", false);
            $(".database-container").find("select").attr("disabled", false);

            $(".shape_base_aux").off("click");


            if (new_relation !== null) {
                if (new_relation["source"] !== undefined)
                    remove_table_highlight(new_relation["source"]);

                LogStatus("Creation of entity relation cancelled");
            }

        }
    } catch (err) {
        call_error_dialog(err, "setup table relation");
    }
}

/**
 *
 * @param e
 * @param newlabel
 */
function update_link_label(e, newlabel) {
    try {
        var new_label = newlabel;

        if (newlabel === undefined) {
            new_label = $(".link-name-input")[0].value;
        }

        current_link._label = new_label;

        if (new_label.length > MAX_LINK_LABEL_CHARS) {
            new_label = new_label.substring(0, MAX_LINK_LABEL_CHARS - 1) + "..";
        }
        current_link._link.label(0, {attrs: {text: {text: new_label}}});

        LogStatus("Relation name updated");
    } catch (err) {
        call_error_dialog(err, "mupdate link label");
    }
}

/**
 * Show link properties
 * @param e
 * @param this_link_id
 */
function show_link_properties(e, this_link_id) {
    try {
        clear_table_properties_panel();

        if (this_link_id === undefined) {
            a = $(this);

            var this_link = $(this);

            this_link_id = this_link.parent().parent().parent().attr("model-id");
        }

        current_link = null;
        if (current_diagram === 0) {
            for (var i = conceptual_links_list.length - 1; i >= 0; i--) {
                if (conceptual_links_list[i]._link.id == this_link_id) {
                    current_link = conceptual_links_list[i];
                    break;
                }
            }
        } else if (current_diagram == 1) {
            for (var i = physical_links_list.length - 1; i >= 0; i--) {
                if (physical_links_list[i]._link.id == this_link_id) {
                    current_link = physical_links_list[i];
                    break;
                }
            }
        }

        if (current_link === null) return;
        if (current_link._order == "Physical") {
            return;
        }

        // Properties DIV
        var content = '<div id="properties_link_name" class="properties-link-name">';

        // Don't show relation name if it is an inheritance relation
        if (current_link._order == "normal") {
            content += '<label>Relation name</label>';
            content += '<input class="link-name-input" id="link_name_input" type="text" oninput="update_link_label()" value="' + current_link._label + '" style="width: 165px; margin-left: 22px;"/>';
        }
        ////

        content += '<button id="tools-delete-link" onclick="remove_link()"><img src="icons/clear.png"></button>';

        if (current_link._order == "parenting") {
            content += hierarchy_properties_html(current_link);
        }

        if (current_link._order == "normal") {
            for (i = 0; i < conceptual_tables_list.length; ++i) {
                if (conceptual_tables_list[i].shape.id == current_link._source.id) {
                    content += '<div class="align_link_cell_left"><label class="properties-link-relation-source">' + conceptual_tables_list[i].data.table_name + ' Cardinality</label></div>';
                    content += '<div class="align_link_cell_right"><select onchange="change_link_type(\'source\');" id="properties-link-type-source">';
                    break;
                }
            }
            if (current_link._sourceCard == "0:1") {
                content += '<option selected value="0:1">0..1</option>';
            } else {
                content += '<option value="0:1">0..1</option>';
            }
            if (current_link._sourceCard == "1:1") {
                content += '<option selected value="1:1">1..1</option>';
            } else {
                content += '<option value="1:1">1..1</option>';
            }
            if (current_link._sourceCard == "0:n") {
                content += '<option selected value="0:n">0..n</option>';
            } else {
                content += '<option value="0:n">0..n</option>';
            }
            if (current_link._sourceCard == "1:n") {
                content += '<option selected value="1:n">1..n</option>';
            } else {
                content += '<option value="1:n">1..n</option>';
            }
            content += '</select></div>';

            // Checkbox for dependent relations
            content += '<div class="align_link_cell_left"><label class="properties-link-relation-source">' + conceptual_tables_list[i].data.table_name + ' is weak </label></div>';
            content += '<div class="align_link_cell_right"><input class="link-name-input" type="checkbox" id="source_is_weak" style="margin-left: -20px" onclick="change_weak_status(current_link,true)"></div>';

            for (i = 0; i < conceptual_tables_list.length; ++i) {
                if (conceptual_tables_list[i].shape.id == current_link._target.id) {
                    content += '<div class="align_link_cell_left"><label class="properties-link-relation-target">' + conceptual_tables_list[i].data.table_name + ' Cardinality</label></div>';
                    content += '<div class="align_link_cell_right"><select onchange="change_link_type(\'target\');" id="properties-link-type-target">';
                    break;
                }
            }
            if (current_link._targetCard == "0:1") {
                content += '<option selected value="0:1">0..1</option>';
            } else {
                content += '<option value="0:1">0..1</option>';
            }
            if (current_link._targetCard == "1:1") {
                content += '<option selected value="1:1">1..1</option>';
            } else {
                content += '<option value="1:1">1..1</option>';
            }
            if (current_link._targetCard == "0:n") {
                content += '<option selected value="0:n">0..n</option>';
            } else {
                content += '<option value="0:n">0..n</option>';
            }
            if (current_link._targetCard == "1:n") {
                content += '<option selected value="1:n">1..n</option>';
            } else {
                content += '<option value="1:n">1..n</option>';
            }

            content += '</select></div>';

            // Checkbox for dependent relations
            content += '<div class="align_link_cell_left"><label>' + conceptual_tables_list[i].data.table_name + ' is weak </label></div>';
            content += '<div class="align_link_cell_right"><input class="link-name-input" type="checkbox" id="target_is_weak" style="margin-left: -20px" onclick="change_weak_status(current_link,false)"></div>';
        }

        content += '</div>';

        // Remove possible highlights. Clean the panel
        if (current_table !== null) {
            remove_table_highlight(current_table);
            current_table = null;
        }

        clear_table_properties_panel();

        $("#properties_link").html(content);

        if (current_link._order == "parenting")
            document.getElementById("hierarchy-type").value = current_link._hierType;

        if (current_link._sourceisweak) {
            $('#source_is_weak').prop('checked', true);
            document.getElementById('properties-link-type-target').disabled = true;
        }
        if (current_link._targetisweak) {
            $('#target_is_weak').prop('checked', true);
            document.getElementById('properties-link-type-source').disabled = true;
        }

        highlight_relation(current_link);
        LogStatus("Relation options");
    } catch (err) {
        call_error_dialog(err, "show link properties");
    }
}

/**
 * Change link type
 * @param side
 */
function change_link_type(side) {
    var myselect, link_type, weak;

    try {
        if (side == "source") {
            myselect = document.getElementById("properties-link-type-source");
            link_type = myselect.options[myselect.selectedIndex].value;
            current_link._sourceCard = link_type;
            weak = current_link._sourceisweak;
        }
        else if (side == "target") {
            myselect = document.getElementById("properties-link-type-target");
            link_type = myselect.options[myselect.selectedIndex].value;
            current_link._targetCard = link_type;
            weak = current_link._targetisweak;
        } else {
            return;
        }

        LogStatus("Changed relation type of the " + side + " entity");

        if (link_type == "1:1") {
            if (weak) {
                current_link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: weakEntity_svg_11
                });
            } else {
                current_link._link.attr('.marker-' + side, {
                    fill: "transparent",
                    d: "M 0 0 L 25 0 M 25 0 L 25 10 M 25 0 L 25 -10 M 10 0 L 10 10 M 10 0 L 10 -10"
                });
            }
        } else if (link_type == "1:n") {
            if (weak) {
                current_link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: weakEntity_svg_1N
                });
            } else {
                current_link._link.attr('.marker-' + side, {
                    fill: "transparent",
                    d: "M 0 0 L 25 0 M 25 0 L 0 10 M 25 0 L 0 -10 M 25 10 L 25 -10"
                });
            }
        } else if (link_type == "0:n") {
            if (weak) {
                current_link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: weakEntity_svg_0N
                });
            } else {
                current_link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: "M 0 0 L 16 0 M 16 0 L 0 10 M 16 0 L 0 -10 M 20 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0"
                });
            }
        } else if (link_type == "0:1") {
            if (weak) {
                current_link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: weakEntity_svg_01
                });
            } else {
                current_link._link.attr('.marker-' + side, {
                    fill: "white",
                    d: "M 0 0 L 16 0 M 10 10 L 10 -10 M 20 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0"
                });
            }
        }
    } catch (err) {
        call_error_dialog(err, "change link type");
    }
}

/**
 * Create link
 * @param _source
 * @param _target
 * @param _order
 * @param _hierType
 * @param _sourceCard
 * @param _targetCard
 * @param isSoft
 * @param sourceisweak
 * @param targetisweak
 * @param arrows_fill
 * @param in_vertices
 * @returns {*}
 */
function createLink(_source, _target, _order, _hierType, _sourceCard, _targetCard,
                    isSoft, sourceisweak, targetisweak, arrows_fill, in_vertices) {
    try {
        if (arrows_fill === undefined) {
            arrows_fill = 'none';
        }

        if (sourceisweak === undefined) {
            sourceisweak = false;
        }

        if (targetisweak === undefined) {
            targetisweak = false;
        }


        var parentingLabel = _hierType;
        _order == "parenting" ? default_label = parentingLabel : default_label = "new relation";

        var _vertices = [];

        if (_source == _target) {
            var source_position = _source.get("position");
            var source_size = _source.get("size");
            var _x = source_position.x + (source_size.width / 2);
            var _y = source_position.y + (source_size.height / 2);

            _vertices = [{x: _x - 50, y: _y - 60}, {x: _x + 50, y: _y - 60}];

        } else {
            var source_position = _source.get("position");
            var source_size = _source.get("size");

            var target_position = _target.get("position");
            var target_size = _target.get("size");

            var _x = (source_position.x + (source_size.width / 2) + target_position.x + (target_size.width / 2)) / 2;
            var _y = (source_position.y + (source_size.height / 2) + target_position.y + (target_size.height / 2)) / 2;

            _vertices = [{x: _x, y: _y}];
        }

        if (in_vertices !== undefined) // If receives a list of vertices in the call, they are the ones that are going to be used
            _vertices = in_vertices;

        var l = new joint.dia.Link({
            source: {id: _source.id},
            target: {id: _target.id},
            vertices: _vertices,
            labels: [
                {position: 0.5, attrs: {text: {text: default_label}}}
            ]
        });

        var parenting_child = 'M 0 0';
        var parenting_parent = 'M 0 10 L 20 0 L 20 20 L 0 10';

        var source_order;
        var target_order;
        var arrows_fill = "none";

        var physical_child = parenting_child;
        var physical_parent = 'M 0 10 L 20 0 L 20 20 L 0 10';

        if (_order == "normal") {
            if (_sourceCard == "0:1") {
                if (sourceisweak)
                    source_order = weakEntity_svg_01;
                else
                    source_order = "M 0 0 L 16 0 M 10 10 L 10 -10 M 20 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0";
            } else if (_sourceCard == "1:1") {
                if (sourceisweak)
                    source_order = weakEntity_svg_11;
                else
                    source_order = "M 0 10 L 10 10 L 10 20 M 10 10 L 10 0 M 10 10 L 16 10 L 16 20 M 16 10 L 16 0";
            } else if (_sourceCard == "0:n") {
                if (sourceisweak)
                    source_order = weakEntity_svg_0N;
                else
                    source_order = "M 0 0 L 16 0 M 16 0 L 0 10 M 16 0 L 0 -10 M 20 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0";
            } else if (_sourceCard == "1:n") {
                if (sourceisweak)
                    source_order = weakEntity_svg_1N;
                else
                    source_order = "M 0 0 L 16 0 M 16 0 L 0 10 M 16 0 L 0 -10 M 16 10 L 16 -10";
            }

            if (_targetCard == "0:1") {
                if (targetisweak)
                    target_order = weakEntity_svg_01;
                else
                    target_order = "M 0 0 L 16 0 M 10 10 L 10 -10 M 20 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0";
            } else if (_targetCard == "1:1") {
                if (targetisweak)
                    target_order = weakEntity_svg_11;
                else
                    target_order = "M 0 10 L 10 10 L 10 20 M 10 10 L 10 0 M 10 10 L 16 10 L 16 20 M 16 10 L 16 0";
            } else if (_targetCard == "0:n") {
                if (targetisweak)
                    target_order = weakEntity_svg_0N;
                else
                    target_order = "M 0 0 L 16 0 M 16 0 L 0 10 M 16 0 L 0 -10 M 20 0 m -4 0 a 4 4 0 1 1 8 0 a 4 4 0 1 1 -8 0";
            } else if (_targetCard == "1:n") {
                if (targetisweak)
                    target_order = weakEntity_svg_1N;
                else
                    target_order = "M 0 0 L 16 0 M 16 0 L 0 10 M 16 0 L 0 -10 M 16 10 L 16 -10";
            }
        }

        else if (_order == "parenting") {
            source_order = parenting_child;
            target_order = parenting_parent;
        }

        else if (_order == "Physical" || _order == "Physical-parenting") {
            source_order = physical_child;
            target_order = physical_parent;
            arrows_fill = 'black';
        }

        l.attr({
            '.connection': {stroke: 'black'},
            '.marker-source': {fill: arrows_fill, d: source_order},
            '.marker-target': {fill: arrows_fill, d: target_order}
        });

        // If it is a soft connection, line is dashed
        if (isSoft === true) {
            l.attr({'.connection': {"stroke-dasharray": "5,5"}});
        }

        if (_order == "Physical" || _order == "Physical-parenting") {

        } else {  // Is a link for the conceptual diagram
            conceptual_links_list.push(
                new SQL_Link(
                    _source, _target, _order, _hierType, _sourceCard, _targetCard,
                    isSoft, l, default_label, sourceisweak, targetisweak
                )
            );
        }

        return l;
    } catch (err) {
        call_error_dialog(err, "create link");
    }
}

/**
 * Create sql table
 * @param graph
 * @param _x
 * @param _y
 * @param table_name
 * @param fields
 * @param checkName
 * @param checkCondition
 * @returns {*}
 */
function create_sql_table(graph, _x, _y, table_name, fields, checkName, checkCondition) {
    try {
        // Create Shape
        var fieldNames = [];
        var length = fields.length;

        for (var i = 0; i < length; i++) {
            fieldNames.push(fields[i].fieldName);
            for (var j = fieldNames[i].length; j < MAX_FIELD_CHARS + 1; j++) {
                fieldNames[i] += " ";
            }

            fieldNames[i] += scripts[db_chosen]["types_abrev"][fields[i].fieldType];
        }

        var shape = createShape(_x, _y, table_name, fieldNames);

        // Create table data
        var data = new SQL_Table_data(table_name, fields, checkName, checkCondition);

        // Add new shape to graph
        graph.addCell(shape);

        // Find new shape element in the document (this element will receive the event listener)
        var rects = $('.Conceptual_TableElement');

        // rectSelected
        var rects_top_layers = $('.shape_base_aux');
        var sql_table = null;
        length = rects.length;
        for (var i = 0; i < length; i++) {
            if (rects[i].getAttribute("model-id") == shape.id) {
                sql_table = new SQL_Table(rects[i], shape, data); // Create the node with data, shape and element (rect)
                $(rects_top_layers[i]).on("mousedown", show_table_properties.bind(null, null, sql_table));
                $(rects_top_layers[i]).on("touchstart", show_table_properties.bind(null, null, sql_table));
                $(rects_top_layers[i]).on("touchmove", show_table_properties.bind(null, null, sql_table));
                break;
            }
        }
        current_table = sql_table;
        update_table_graph();
        current_table = null;
        return sql_table;
    } catch (err) {
        call_error_dialog(err, "create sql table");
    }
}

function getBrowser() {

    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    var isFirefox = typeof InstallTrigger !== 'undefined';

    var isSafari = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;

    var isChrome = !!window.chrome && !!window.chrome.webstore;

    return isOpera ? "Opera" : isFirefox ? "Firefox" : isSafari ? "Safari" : isChrome ? "Chrome" : "Not Supported";
}