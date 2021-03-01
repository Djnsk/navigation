const express = require('express');
const process = require('process');
const path = require('path');

const app = express();

const SRC_FOLDER = path.join(process.cwd(), 'src')

app.set('view engine', 'ejs');
app.set('views', SRC_FOLDER);

app.use('/src/images', express.static(path.join(SRC_FOLDER, 'images')));
app.use('/src/styles', express.static(path.join(SRC_FOLDER, 'styles')));
app.use('/src/vendor', express.static(path.join(SRC_FOLDER, 'vendor')));
app.use('/src/scripts', express.static(path.join(SRC_FOLDER, 'scripts')));
app.use('/api/data', express.static(path.join(SRC_FOLDER, 'data')));

app.get('/favicon.ico', (request, response) => {
	response.sendFile(path.join(SRC_FOLDER, 'favicon.ico'));
});

app.use('/', function (reqest, response) {
	var data = {};

	response.render(path.join('pages', reqest.path), data);
});

app.listen(80);
