const multicolorPicker = document.getElementById('multicolor-picker');
const colorPickerInput = document.getElementById('color-picker');
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const fontFamily = document.getElementById('font-family');
const fontSize = document.getElementById('font-size');
const brushToolBtn = document.getElementById('brush-tool-btn');
const textToolBtn = document.getElementById('text-tool-btn');
const selectToolBtn = document.getElementById('select-tool-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const boldCheckbox = document.getElementById('bold-checkbox');
const italicCheckbox = document.getElementById('italic-checkbox');
const underlineCheckbox = document.getElementById('underline-checkbox');
const brushStyleSelect = document.getElementById('brush-style');
const saveBtn = document.getElementById('save-btn');

let tool = 'text'; 
let isDrawing = false;
let isDragging = false;
let selectedObject = null; 
let selectedStroke = null; 
let offsetX = 0, offsetY = 0; 
let textArray = []; 
let brushArray = []; 
let undoStack = [];
let redoStack = [];


function getFontStyle() {
    let style = "";
    if (boldCheckbox.checked) style += "bold ";
    if (italicCheckbox.checked) style += "italic ";
    return style;
}


brushToolBtn.addEventListener('click', () => {
    tool = 'brush';
    canvas.style.cursor = 'crosshair';
});

textToolBtn.addEventListener('click', () => {
    tool = 'text';
    canvas.style.cursor = 'text';
});

selectToolBtn.addEventListener('click', () => {
    tool = 'select';
    canvas.style.cursor = 'default'; 
});


canvas.addEventListener('mousedown', (e) => {
    const mousePos = { x: e.offsetX, y: e.offsetY };

    if (tool === 'text') {
        
        const textValue = prompt("Enter your text:");

        if (textValue) {
            const newText = {
                text: textValue,
                x: mousePos.x,
                y: mousePos.y,
                font: `${getFontStyle()} ${fontSize.value}px ${fontFamily.value}`,
                color: colorPickerInput.value,
                isBold: boldCheckbox.checked,
                isItalic: italicCheckbox.checked,
                isUnderlined: underlineCheckbox.checked
            };
            textArray.push(newText);
            saveState();
            redrawCanvas(); 
        }
    } else if (tool === 'select') {
        const selectedIndex = findObjectAtPosition(mousePos);
        if (selectedIndex !== null) {
            selectedObject = textArray[selectedIndex]; 
            isDragging = true;
            offsetX = mousePos.x - selectedObject.x;
            offsetY = mousePos.y - selectedObject.y;
            canvas.style.cursor = 'move'; 
        } else {
            const selectedStrokeIndex = findBrushStrokeAtPosition(mousePos);
            if (selectedStrokeIndex !== null) {
                selectedStroke = brushArray[selectedStrokeIndex]; 
                isDragging = true;
                canvas.style.cursor = 'move'; 
            }
        }
    } else if (tool === 'brush') {
        isDrawing = true;
        brushArray.push([{ x: e.offsetX, y: e.offsetY }]); 
    }
});

canvas.addEventListener('mousemove', (e) => {
    const mousePos = { x: e.offsetX, y: e.offsetY };

    if (isDrawing && tool === 'brush') {
        const lastStroke = brushArray[brushArray.length - 1];
        lastStroke.push({ x: mousePos.x, y: mousePos.y });
        redrawCanvas();
    } else if (isDragging) {
        if (selectedObject) {
            selectedObject.x = mousePos.x - offsetX;
            selectedObject.y = mousePos.y - offsetY;
        } else if (selectedStroke) {
            const dx = mousePos.x - selectedStroke[0].x;
            const dy = mousePos.y - selectedStroke[0].y;
            for (let point of selectedStroke) {
                point.x += dx;
                point.y += dy;
            }
            selectedStroke[0].x = mousePos.x; 
        }
        redrawCanvas(); 
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    isDragging = false;
    selectedObject = null;
    selectedStroke = null; 
    if (tool === 'brush') {
        saveState(); 
    }
});

function saveState() {
    undoStack.push({ brush: JSON.parse(JSON.stringify(brushArray)), text: JSON.parse(JSON.stringify(textArray)) });
    redoStack = []; 
}

undoBtn.addEventListener('click', () => {
    if (undoStack.length > 0) {
        redoStack.push(undoStack.pop());
        const lastState = undoStack[undoStack.length - 1];
        if (lastState) {
            brushArray = lastState.brush;
            textArray = lastState.text;
            redrawCanvas();
        }
    }
});

redoBtn.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const stateToRedo = redoStack.pop();
        undoStack.push(stateToRedo);
        brushArray = stateToRedo.brush;
        textArray = stateToRedo.text;
        redrawCanvas();
    }
});


function findObjectAtPosition(pos) {
    for (let i = 0; i < textArray.length; i++) {
        const text = textArray[i];
        ctx.font = text.font;
        const metrics = ctx.measureText(text.text);
        if (pos.x > text.x && pos.x < text.x + metrics.width && pos.y > text.y - parseInt(fontSize.value) && pos.y < text.y) {
            return i; 
        }
    }
    return null;
}


function findBrushStrokeAtPosition(pos) {
    for (let i = 0; i < brushArray.length; i++) {
        const stroke = brushArray[i];
        for (let j = 0; j < stroke.length; j++) {
            const point = stroke[j];
            if (Math.abs(point.x - pos.x) < 5 && Math.abs(point.y - pos.y) < 5) {
                return i; 
            }
        }
    }
    return null; 
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 


    for (let brush of brushArray) {
        ctx.beginPath();
        for (let i = 0; i < brush.length; i++) {
            if (i === 0) {
                ctx.moveTo(brush[i].x, brush[i].y);
            } else {
                ctx.lineTo(brush[i].x, brush[i].y);
            }
        }
        ctx.strokeStyle = colorPickerInput.value;
        ctx.lineWidth = 2;


        switch (brushStyleSelect.value) {
            case 'dotted':
                ctx.setLineDash([2, 2]); 
                break;
            case 'dashed':
                ctx.setLineDash([10, 5]); 
                break;
            default:
                ctx.setLineDash([]); 
                break;
        }
        
        ctx.stroke();
        ctx.closePath();
    }


    for (let text of textArray) {
        ctx.font = text.font;
        ctx.fillStyle = text.color;


        ctx.fillText(text.text, text.x, text.y);


        if (text.isUnderlined) {
            const metrics = ctx.measureText(text.text);
            ctx.beginPath();
            ctx.moveTo(text.x, text.y + 2); 
            ctx.lineTo(text.x + metrics.width, text.y + 2);
            ctx.strokeStyle = text.color;
            ctx.stroke();
            ctx.closePath();
        }
    }
}


saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'canvas.png';
    link.href = canvas.toDataURL();
    link.click();
});
