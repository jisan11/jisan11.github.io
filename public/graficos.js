
function init() {
    const $ = go.GraphObject.make;
    myDiagram = $(go.Diagram, "myDiagramDiv",
        {   
            //cuadriculas en la pizarra
            grid: $(go.Panel, "Grid",
                $(go.Shape, "LineH", { stroke: "lightgray", strokeWidth: 0.5 }),
                $(go.Shape, "LineH", { stroke: "gray", strokeWidth: 0.5, interval: 5 }),
                $(go.Shape, "LineV", { stroke: "lightgray", strokeWidth: 0.5 }),
                $(go.Shape, "LineV", { stroke: "gray", strokeWidth: 0.5, interval: 5 })
            ),
            "LinkDrawn": showLinkLabel,  // este oyente DiagramEvent se define a continuación
            "LinkRelinked": showLinkLabel,
            "undoManager.isEnabled": true,
            "animationManager.initialAnimationStyle": go.AnimationManager.None,
            //"InitialAnimationStarting": animateFadeDown,
            // habilitar deshacer y rehacer
            "draggingTool.dragsLink": true,
            "draggingTool.isGridSnapEnabled": true,
            "linkingTool.isUnconnectedLinkValid": true,
            "linkingTool.portGravity": 20,
            "relinkingTool.isUnconnectedLinkValid": true,
            "relinkingTool.portGravity": 20,
            "relinkingTool.fromHandleArchetype":
                $(go.Shape, "Diamond", { segmentIndex: 0, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "tomato", stroke: "darkred" }),
            "relinkingTool.toHandleArchetype":
                $(go.Shape, "Diamond", { segmentIndex: -1, cursor: "pointer", desiredSize: new go.Size(8, 8), fill: "darkred", stroke: "tomato" }),
            "linkReshapingTool.handleArchetype":
                $(go.Shape, "Diamond", { desiredSize: new go.Size(7, 7), fill: "lightblue", stroke: "deepskyblue" }),
            mouseDrop: function (e, node) {
                save();
            }
        }
    );
  
    // show visibility or access as a single character at the beginning of each property or method
    //mostrar visibilidad o acceso como un solo carácter al comienzo de cada propiedad o método
    function convertVisibility(v) {
        switch (v) {
            case "public": return "+";
            case "private": return "-";
            case "protected": return "#";
            case "package": return "~";
            default: return v;
        }
    }
  
    // the item template for properties (la plantilla de elemento para propiedades)
    var propertyTemplate =
        $(go.Panel, "Horizontal",
            // property visibility/access (visibilidad/acceso a la propiedad)
            $(go.TextBlock,
                { isMultiline: false, editable: false, width: 12 },
                new go.Binding("text", "visibility", convertVisibility)),
            // property name, underlined if scope=="class" to indicate static property
            //nombre de propiedad, subrayado si scope=="class" para indicar propiedad estática
            $(go.TextBlock,
                { isMultiline: false, editable: true },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("isUnderline", "scope", s => s[0] === 'c')),
            // property type, if known (tipo de propiedad, si se conoce)
            $(go.TextBlock, "",
                new go.Binding("text", "type", t => t ? ": " : "")),
            $(go.TextBlock,
                { isMultiline: false, editable: true },
                new go.Binding("text", "type").makeTwoWay()),
            // property default value, if any (valor predeterminado de la propiedad, si lo hay)
            $(go.TextBlock,
                { isMultiline: false, editable: false },
                new go.Binding("text", "default", s => s ? " = " + s : ""))
        );
  
    // the item template for methods (la plantilla de elementos para métodos)
    var methodTemplate =
        $(go.Panel, "Horizontal",
            // method visibility/access (visibilidad/acceso al método)
            $(go.TextBlock,
                { isMultiline: false, editable: false, width: 12 },
                new go.Binding("text", "visibility", convertVisibility)),
            // method name, underlined if scope=="class" to indicate static method
            $(go.TextBlock,
                { isMultiline: false, editable: true },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("isUnderline", "scope", s => s[0] === 'c')),
            // method parameters
            $(go.TextBlock, "()",
                // this does not permit adding/editing/removing of parameters via inplace edits
                new go.Binding("text", "parameters", parr => {
                    var s = "(";
                    for (var i = 0; i < parr.length; i++) {
                        var param = parr[i];
                        if (i > 0) s += ", ";
                        s += param.name + ": " + param.type;
                    }
                    return s + ")";
                })),
            // method return type, if any
            $(go.TextBlock, "",
                new go.Binding("text", "type", t => t ? ": " : "")),
            $(go.TextBlock,
                { isMultiline: false, editable: true },
                new go.Binding("text", "type").makeTwoWay())
        );
  
    myDiagram.nodeTemplateMap.add("tabla",
        $(go.Node, "Auto", nodeStyle(),
            {
                resizable: true, minSize: new go.Size(162, 62),
                locationSpot: go.Spot.Center,
                fromSpot: go.Spot.AllSides,
                toSpot: go.Spot.AllSides
            },
            $(go.Shape, { fill: "lightyellow" }),
            $(go.Panel, "Table",
                { defaultRowSeparatorStroke: "black", stretch: go.GraphObject.Fill, margin: 0.5 },
                //header
                $(go.TextBlock,
                    {
                        row: 0, columnSpan: 2, margin: 3, alignment: go.Spot.Center,
                        font: "bold 12pt sans-serif",
                        isMultiline: false, editable: true,
                    },
                    new go.Binding("text", "name").makeTwoWay()
                ),
                //properties
                $(go.TextBlock, "Properties",
                    { row: 1, font: "italic 10pt sans-serif" },
                    new go.Binding("visible", "visible", v => !v).ofObject("PROPERTIES")
                ),
                $(go.Panel, "Vertical", { name: "PROPERTIES" },
                    new go.Binding("itemArray", "properties"),
                    {
                        row: 1, margin: 3, stretch: go.GraphObject.Fill,
                        defaultAlignment: go.Spot.Left, background: "lightyellow",
                        itemTemplate: propertyTemplate
                    }
                ),
                $("PanelExpanderButton", "PROPERTIES",
                    { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false },
                    new go.Binding("visible", "properties", arr => arr.length > 0)
                ),
                // methods
                $(go.TextBlock, "Methods",
                    { row: 2, font: "italic 10pt sans-serif" },
                    new go.Binding("visible", "visible", v => !v).ofObject("METHODS")
                ),
                $(go.Panel, "Vertical", { name: "METHODS" },
                    new go.Binding("itemArray", "methods"),
                    {
                        row: 2, margin: 3, stretch: go.GraphObject.Fill,
                        defaultAlignment: go.Spot.Left, background: "lightyellow",
                        itemTemplate: methodTemplate
                    }
                ),
                $("PanelExpanderButton", "METHODS",
                    { row: 2, column: 1, alignment: go.Spot.TopRight, visible: false },
                    new go.Binding("visible", "methods", arr => arr.length > 0)
                ),
                {
  
                    click: function (e, node) {
                        save();
                    }
                }
            ),
            makePort("T", go.Spot.Top, go.Spot.Top, true, true),
            makePort("L", go.Spot.Left, go.Spot.Left, true, true),
            makePort("R", go.Spot.Right, go.Spot.Right, true, true),
            makePort("B", go.Spot.Bottom, go.Spot.Bottom, true, true),
            { // handle mouse enter/leave events to show/hide the ports
                mouseEnter: (e, node) => showSmallPorts(node, true),
                mouseLeave: (e, node) => showSmallPorts(node, false)
            }
        )
    );
  
    function showSmallPorts(node, show) {
        node.ports.each(port => {
            if (port.portId !== "") {  // don't change the default port, which is the big shape
                port.fill = show ? "rgba(0,0,0,.3)" : null;
            }
        });
    }
  
    //-------------------------------------------------------------------------
    /*function convertIsTreeLink(r) {
        return r === "generalization";
    }
  
    function convertFromArrow(r) {
        switch (r) {
            case "generalization": return "";
            default: return "";
        }
    }
  
    function convertToArrow(r) {
        switch (r) {
            case "generalization": return "Triangle";
            case "aggregation": return "StretchedDiamond";
            case "asociacionBidireccional": return;
            case "asociacionUnidireccional": return "OpenTriangle"
            default: return "";
        }
    }
  
    myDiagram.linkTemplate =
        $(go.Link,
            { routing: go.Link.Orthogonal },
            new go.Binding("isLayoutPositioned", "relationship", convertIsTreeLink),
            $(go.Shape),
            $(go.Shape, { scale: 1.3, fill: "white" },
                new go.Binding("fromArrow", "relationship", convertFromArrow)),
            $(go.Shape, { scale: 1.3, fill: "white" },
                new go.Binding("toArrow", "relationship", convertToArrow))
        );
  */
    //----------------------------------------------------------------------
    var linkSelectionAdornmentTemplate =
        $(go.Adornment, "Link",
            $(go.Shape,
                // isPanelMain declares that this Shape shares the Link.geometry
                { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 })  // use selection object's strokeWidth
        );
  
    myDiagram.linkTemplate =
        $(go.Link,  // the whole link panel
            { selectable: true, selectionAdornmentTemplate: linkSelectionAdornmentTemplate },
            { relinkableFrom: true, relinkableTo: true, reshapable: true },
            {
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpOver,
                corner: 5,
                toShortLength: 4
            },
            new go.Binding("points").makeTwoWay(),
            $(go.Shape,  // the link path shape
                { isPanelMain: true, strokeWidth: 2 }),
            $(go.Shape,  // the arrowhead
                { toArrow: "", stroke: null }),
            $(go.TextBlock, "from", 
                { 
                    font: "10pt helvetica, arial, sans-serif",
                    minSize: new go.Size(10, NaN),
                    editable: true,
                    segmentIndex: 1, 
                    segmentFraction: 0.2,
                    segmentOffset: new go.Point(0, -10),
                    segmentOrientation: go.Link.OrientUpright,
                }
            ),
            $(go.TextBlock, "mid",
                { 
                    font: "10pt helvetica, arial, sans-serif",
                    minSize: new go.Size(10, NaN),
                    editable: true,
                    segmentIndex: 2, 
                    segmentFraction: 0.5,
                    segmentOffset: new go.Point(0, -10),
                    segmentOrientation: go.Link.OrientUpright 
                }
            ),
            $(go.TextBlock, "to", 
                { 
                    font: "10pt helvetica, arial, sans-serif",
                    minSize: new go.Size(10, NaN),
                    editable: true,
                    segmentIndex: 3, 
                    segmentFraction: 0.8,
                    segmentOffset: new go.Point(0, -10),
                    segmentOrientation: go.Link.OrientUpright 
                }
            )
        );
    //----------------------------------------------------------------------
    const nodedata = [
        {
            category: "tabla",
            key: 1,
            name: "BankAccount",
            properties: [
                { name: "owner", type: "String", visibility: "public" },
                { name: "balance", type: "Currency", visibility: "public", default: "0" }
            ],
            methods: [
                { name: "deposit", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" },
                { name: "withdraw", parameters: [{ name: "amount", type: "Currency" }], visibility: "public" }
            ]
        },
        {
            category: "tabla",
            key: 11,
            name: "Person",
            properties: [
                { name: "name", type: "String", visibility: "public" },
                { name: "birth", type: "Date", visibility: "protected" }
            ],
            methods: [
                { name: "getCurrentAge", type: "int", visibility: "public" }
            ]
        },
        {
            category: "tabla",
            key: 12,
            name: "Student",
            properties: [
                { name: "classes", type: "List", visibility: "public" }
            ],
            methods: [
                { name: "attend", parameters: [{ name: "class", type: "Course" }], visibility: "private" },
                { name: "sleep", visibility: "private" }
            ]
        },
        {
            category: "tabla",
            key: 13,
            name: "Professor",
            properties: [
                { name: "classes", type: "List", visibility: "public" }
            ],
            methods: [
                { name: "teach", parameters: [{ name: "class", type: "Course" }], visibility: "private" }
            ]
        },
        /*{
            category: "tabla",
            key: 14,
            name: "Course",
            properties: [
                { name: "name", type: "String", visibility: "public" },
                { name: "description", type: "String", visibility: "public" },
                { name: "professor", type: "Professor", visibility: "public" },
                { name: "location", type: "String", visibility: "public" },
                { name: "times", type: "List", visibility: "public" },
                { name: "prerequisites", type: "List", visibility: "public" },
                { name: "students", type: "List", visibility: "public" }
            ]
        }*/
    ];
  
  
    myPalette =
        $(go.Palette, "myPaletteDiv",
            {
                maxSelectionCount: 1,
                nodeTemplateMap: myDiagram.nodeTemplateMap,  // share the templates used by myDiagram
                linkTemplate: // simplify the link template, just in this Palette
                    $(go.Link,
                        { // because the GridLayout.alignment is Location and the nodes have locationSpot == Spot.Center,
                            // to line up the Link in the same manner we have to pretend the Link has the same location spot
                            locationSpot: go.Spot.Center,
                            selectionAdornmentTemplate:
                                $(go.Adornment, "Link",
                                    { locationSpot: go.Spot.Center },
                                    $(go.Shape,
                                        { isPanelMain: true, fill: null, stroke: "deepskyblue", strokeWidth: 0 }),
                                    $(go.Shape,  // the arrowhead
                                        { toArrow: "", stroke: null })
                                )
                        },
                        {
                            routing: go.Link.AvoidsNodes,
                            curve: go.Link.JumpOver,
                            corner: 5,
                            toShortLength: 4
                        },
                        new go.Binding("points"),
                        $(go.Shape,  // the link path shape
                            { isPanelMain: true, strokeWidth: 2 }),
                        $(go.Shape,  // the arrowhead
                            { toArrow: "", stroke: null })
                    ),
                model: new go.GraphLinksModel(
                    {
                        copiesArrays: true,
                        copiesArrayObjects: true,
                        nodeDataArray: nodedata,
                        //linkDataArray: linkdata,
  
                    }, [
                    // the Palette also has a disconnected Link, which the user can drag-and-drop
                    { points: new go.List(/*go.Point*/).addAll([new go.Point(0, 0), new go.Point(30, 0), new go.Point(30, 40), new go.Point(60, 40)]) }
                    ]
                ),
  
            },
  
        );
  
    // cuando se modifique el documento, agregue un "*" al título y habilite el botón "Guardar"
    myDiagram.addDiagramListener("Modified", e => {
        var button = document.getElementById("SaveButton");
        if (button) button.disabled = !myDiagram.isModified;
        var idx = document.title.indexOf("*");
        if (myDiagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.slice(0, idx);
        }
    });
  
    function nodeStyle() {
        return [
            // El Nodo.ubicación proviene de la propiedad "loc" de los datos del nodo,
            // convertido por el método estático Point.parse.
            // Si se cambia Node.location, actualiza la propiedad "loc" de los datos del nodo,
            // convertir de nuevo usando el método estático Point.stringify.
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            {
                // la ubicación del nodo está en el centro de cada nodo
                locationSpot: go.Spot.Center
            }
        ];
    }
  
    // Definir una función para crear un "puerto" que normalmente sea transparente.
    // El "nombre" se utiliza como GraphObject.portId,
    // la "alineación" se usa para determinar dónde colocar el puerto en relación con el cuerpo del nodo,
    // el "spot" se usa para controlar cómo se conectan los enlaces con el puerto y si el puerto
    // se extiende a lo largo del lado del nodo,
    // y los argumentos booleanos "output" y "input" controlan si el usuario puede dibujar enlaces desde o hacia el puerto.
    function makePort(name, align, spot, output, input) {
        var horizontal = align.equals(go.Spot.Top) || align.equals(go.Spot.Bottom);
        // el puerto es básicamente un rectángulo transparente que se extiende a lo largo del lado del nodo,
        // y se colorea cuando el ratón pasa por encima
        return $(go.Shape,
            {
                fill: "transparent",  // cambiado a un color en el controlador de eventos mouseEnter
                strokeWidth: 0,  // no stroke// sin trazo
                width: horizontal ? NaN : 8,  // si no se estira horizontalmente, solo 8 de ancho
                height: !horizontal ? NaN : 8,  // si no se estira verticalmente, solo 8 de altura
                alignment: align,  // alinea el puerto en la forma principal
                stretch: (horizontal ? go.GraphObject.Horizontal : go.GraphObject.Vertical),
                portId: name,  // declara que este objeto es un "puerto"
                fromSpot: spot,  // declara dónde se pueden conectar los enlaces en este puerto
                fromLinkable: output,  // declara si el usuario puede dibujar enlaces desde aquí
                toSpot: spot,  // declara dónde se pueden conectar los enlaces en este puerto
                toLinkable: input,  // Declarar si el usuario puede dibujar enlaces aquí
                cursor: "pointer",  // mostrar un cursor diferente para indicar un posible punto de enlace
                mouseEnter: (e, port) => {  // el argumento PORT será esta Forma
                    if (!e.diagram.isReadOnly) port.fill = "rgba(255,0,255,0.5)";
                },
                mouseLeave: (e, port) => port.fill = "transparent",
                mouseDrop: function (e, port) {
                    save();
                }
            });
    }
  
    // Hacer visibles las etiquetas de los enlaces si salen de un nodo "condicional".
    // Este oyente es llamado por los DiagramEvents "LinkDrawn" y "LinkRelinked".
    function showLinkLabel(e) {
        var label = e.subject.findObject("LABEL");
        if (label !== null) label.visible = (e.subject.fromNode.data.category === "tabla");
    }
  
    // los enlaces temporales utilizados por LinkingTool y RelinkingTool también son ortogonales:
    myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
    myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;
  
    /*if (window.Inspector) myInspector = new Inspector("myInspector", myDiagram,
    {
        properties: {
            "key": { readOnly: true },
            "comments": {}
        }
    });*/
  
    document.getElementById("blobButton").addEventListener("click", makeBlob);
  }
  
  // Mostrar el modelo del diagrama en formato JSON que el usuario puede editar
  function save() {
    document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    myDiagram.isModified = false;
  }
  function load(x) {
    myDiagram.model = go.Model.fromJson(x);
  }
  // imprime el diagrama abriendo una nueva ventana que contiene imágenes SVG del contenido del diagrama para cada página
  function guardar() {
    localStorage.setItem("diagrama", JSON.stringify(myDiagram.model.toJson()));
  
  }
  function abrir() {
    dig = JSON.parse(localStorage.getItem("diagrama"));
    load(dig);
  }
  function printDiagram() {
    var svgWindow = window.open();
    if (!svgWindow) return;  // error al abrir una nueva ventana
    var printSize = new go.Size(700, 960);
    var bnds = myDiagram.documentBounds;
    var x = bnds.x;
    var y = bnds.y;
    while (y < bnds.bottom) {
        while (x < bnds.right) {
            var svg = myDiagram.makeSvg({ scale: 1.0, position: new go.Point(x, y), size: printSize });
            svgWindow.document.body.appendChild(svg);
            x += printSize.width;
        }
        x = bnds.x;
        y += printSize.height;
    }
    setTimeout(() => svgWindow.print(), 1);
  
  }
  
  function myCallback(blob) {
    var url = window.URL.createObjectURL(blob);
    var filename = "ImagenDiagrama.png";
  
    var a = document.createElement("a");
    a.style = "display: none";
    a.href = url;
    a.download = filename;
  
    // IE 11
    if (window.navigator.msSaveBlob !== undefined) {
      window.navigator.msSaveBlob(blob, filename);
      return;
    }
  
    document.body.appendChild(a);
    requestAnimationFrame(() => {
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }
  
  function makeBlob() {
    var blob = myDiagram.makeImageData({ background: "white", returnType: "blob", callback: myCallback });
  }
  
  function descargarArchivoEAP() {
  // Obtén el contenido del diagrama en formato JSON
  var jsonData = myDiagram.model.toJson();
  
  // Crea un objeto Blob con el contenido JSON
  var blob = new Blob([jsonData], { type: 'application/json' });
  
  // Crea un objeto URL para el blob
  var url = URL.createObjectURL(blob);
  
  // Crea un elemento de enlace para la descarga
  var link = document.createElement('a');
  link.href = url;
  link.download = 'diagrama.eap'; // Nombre del archivo .eap a descargar
  link.style.display = 'none';
  
  // Agrega el enlace al documento
  document.body.appendChild(link);
  
  // Simula un clic en el enlace para iniciar la descarga
  link.click();
  
  // Elimina el enlace del documento
  document.body.removeChild(link);
  }
  
  window.addEventListener('DOMContentLoaded', init);