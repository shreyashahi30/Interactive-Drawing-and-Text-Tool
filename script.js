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

let tool = 'text'; // Default tool is text
let isDrawing = false;
let isDragging = false;
let selectedObject = null; // Selected text object
let selectedStroke = null; // Selected brush stroke
let offsetX = 0, offsetY = 0; // Offset for dragging
let textArray = []; // Array to store text objects
let brushArray = []; // Array to store brush strokes
let undoStack = [];
let redoStack = [];

// Switch between tools
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
    canvas.style.cursor = 'default'; // Change cursor to default when selecting
});

// Allowing text input to be shown at click position
canvas.addEventListener('mousedown', (e) => {
    const mousePos = { x: e.offsetX, y: e.offsetY };

    if (tool === 'text') {
        // Show prompt for text input at the click position
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
        // Check for text selection
        const selectedIndex = findObjectAtPosition(mousePos);
        if (selectedIndex !== null) {
            selectedObject = textArray[selectedIndex]; // Save the selected text object
            isDragging = true;
            offsetX = mousePos.x - selectedObject.x;
            offsetY = mousePos.y - selectedObject.y;
            canvas.style.cursor = 'move'; // Change cursor while dragging
        } else {
            // Check for brush stroke selection
            const selectedStrokeIndex = findBrushStrokeAtPosition(mousePos);
            if (selectedStrokeIndex !== null) {
                selectedStroke = brushArray[selectedStrokeIndex]; // Save the selected brush stroke
                isDragging = true;
                canvas.style.cursor = 'move'; // Change cursor while dragging
            }
        }
    } else if (tool === 'brush') {
        isDrawing = true;
        brushArray.push([{ x: e.offsetX, y: e.offsetY }]); // Start new brush stroke
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
            // Dragging text object
            selectedObject.x = mousePos.x - offsetX;
            selectedObject.y = mousePos.y - offsetY;
        } else if (selectedStroke) {
            // Dragging the entire brush stroke
            const dx = mousePos.x - selectedStroke[0].x;
            const dy = mousePos.y - selectedStroke[0].y;
            for (let point of selectedStroke) {
                point.x += dx;
                point.y += dy;
            }
            selectedStroke[0].x = mousePos.x; // Update starting point to current mouse position
        }
        redrawCanvas(); // Redraw after dragging
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    isDragging = false;
    selectedObject = null; // Reset selectedObject when dragging ends
    selectedStroke = null; // Reset selectedStroke when dragging ends
    if (tool === 'brush') {
        saveState(); // Save the state after drawing
    }
});

// Save the current state to allow undo/redo
function saveState() {
    undoStack.push({ brush: JSON.parse(JSON.stringify(brushArray)), text: JSON.parse(JSON.stringify(textArray)) });
    redoStack = []; // Clear redo stack on new action
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

// Function to find if a text object is at the clicked position
function findObjectAtPosition(pos) {
    for (let i = 0; i < textArray.length; i++) {
        const text = textArray[i];
        ctx.font = text.font;
        const metrics = ctx.measureText(text.text);
        if (pos.x > text.x && pos.x < text.x + metrics.width && pos.y > text.y - parseInt(fontSize.value) && pos.y < text.y) {
            return i; // Return the index of the text
        }
    }
    return null; // Return null if no text found
}

// Function to find if a brush stroke is at the clicked position
function findBrushStrokeAtPosition(pos) {
    for (let i = 0; i < brushArray.length; i++) {
        const stroke = brushArray[i];
        for (let j = 0; j < stroke.length; j++) {
            const point = stroke[j];
            if (Math.abs(point.x - pos.x) < 5 && Math.abs(point.y - pos.y) < 5) {
                return i; // Return index of the stroke
            }
        }
    }
    return null; // Return null if no stroke found
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Draw brush strokes
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

        // Set stroke style based on the selected option
        switch (brushStyleSelect.value) {
            case 'dotted':
                ctx.setLineDash([2, 2]); // Dotted line
                break;
            case 'dashed':
                ctx.setLineDash([10, 5]); // Dashed line
                break;
            default:
                ctx.setLineDash([]); // Solid line
        }

        ctx.stroke();
    }

    // Draw text
    for (let text of textArray) {
        ctx.font = text.font;
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, text.x, text.y);

        // Draw underline if checked
        if (text.isUnderlined) {
            const metrics = ctx.measureText(text.text);
            const underlineY = text.y + 2; // Adjust for positioning the underline
            ctx.beginPath();
            ctx.moveTo(text.x, underlineY);
            ctx.lineTo(text.x + metrics.width, underlineY);
            ctx.strokeStyle = text.color; // Use the same color for the underline
            ctx.lineWidth = 2; // Set underline thickness
            ctx.stroke();
        }
    }
}

// Font style function
function getFontStyle() {
    let fontStyle = '';
    if (boldCheckbox.checked) fontStyle += 'bold ';
    if (italicCheckbox.checked) fontStyle += 'italic ';
    return fontStyle;
}
