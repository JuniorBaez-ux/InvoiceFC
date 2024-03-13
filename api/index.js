const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { x } = require('joi');
const logo = 'logo.png';
const cors = require('cors'); 
require('dotenv').config();


const app = express();
const numeroNGAW = process.env.NUMERO_NGAW || '18498893322';

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send('Home Page Route'));
app.get('/about', (req, res) => res.send('About Page Route'));

app.post('/receive-message', (req, res) => {
    const { tutorname, clientname, cellphoneNumber, fdate } = req.body;

    const optionalNumber = req.body.whatsappNumber || numeroNGAW;

    createInvoiceNGAW(tutorname, clientname, cellphoneNumber, fdate, optionalNumber);

    res.sendStatus(200);
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Server listening on port: ${port}');
})

const client = new Client();

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.initialize();



function sendMessageWithInvoice(number, invoice, pdfName, fileSizeInBytes) {
    var clientNumber = number + "@c.us";
    var invoice = new MessageMedia("application/pdf", invoice, pdfName, fileSizeInBytes);
    client.sendMessage(clientNumber, invoice);
}

function createInvoiceNGAW(tutorname, clientname, cellphoneNumber, fdate, optionalNumber) {
    const doc = new PDFDocument;

    doc.image(logo, { width: 100, height: 100, align: 'center' , x: 250 , y: 10});

    doc.fontSize(15);

    doc.text("Nombre del tutor: " + tutorname, 200, 180);
    doc.text("Nombre del paciente: " + clientname , 200 , 200);
    doc.text("Numero de telefono: " + cellphoneNumber , 200 , 220);
    doc.text("Fecha de consulta: " + formatCustomDate12hr(fdate) , 200 , 240);

    var buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', function () {
        var pdfData = Buffer.concat(buffers);
        var fileSizeInBytes = pdfData.length; // Obtain the file size
        var pdfDataBase64 = pdfData.toString('base64');
        sendMessageWithInvoice(optionalNumber, pdfDataBase64, tutorname  + " - " + formatCustomDate12hr(fdate), fileSizeInBytes);
    });

    doc.pipe(fs.createWriteStream('invoice.pdf'));


    doc.end();
}

function formatCustomDate12hr(dateString) {
    var date = new Date(dateString);
  
    var day = date.getDate().toString().padStart(2, '0'); // Get the day and pad with leading zero if necessary
    var month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get the month (zero-based) and pad with leading zero if necessary
    var year = date.getFullYear();
  
    var hours = date.getHours() % 12 || 12; // Get the hours in 12-hour format
    var minutes = date.getMinutes().toString().padStart(2, '0'); // Get the minutes and pad with leading zero if necessary
    var period = date.getHours() >= 12 ? 'PM' : 'AM'; // Determine the AM or PM designation
  
    return `${day}-${month}-${year} - ${hours}:${minutes} ${period}`;
}
