const d3 = require('d3');
const _ = {
    map: require('lodash/map'),
    uniqBy: require('lodash/uniqBy'),
    capitalize: require('lodash/capitalize'),
    each: require('lodash/each')
};

const InputSanitizer = require('./inputSanitizer');
const Radar = require('../models/radar');
const Quadrant = require('../models/quadrant');
const Ring = require('../models/ring');
const Blip = require('../models/blip');
const GraphingRadar = require('../graphing/radar');
const MalformedDataError = require('../exceptions/malformedDataError');
const SheetNotFoundError = require('../exceptions/sheetNotFoundError');
const ContentValidator = require('./contentValidator');
const Sheet = require('./sheet');
const ExceptionMessages = require('./exceptionMessages');
const RadarData = require('../data/radar2017.json');


const GoogleSheet = function() {
    var self = {};

    self.build = function() {
        createRadar();

        function displayErrorMessage(exception) {
            d3.selectAll(".loading").remove();
            var message = 'Oops! It seems like there are some problems with loading your data. ';

            if (exception instanceof MalformedDataError) {
                message = message.concat(exception.message);
            } else if (exception instanceof SheetNotFoundError) {
                message = exception.message;
            } else {
                console.error(exception);
            }

            message = message.concat('<br/>', 'Please check <a href="https://info.thoughtworks.com/visualize-your-tech-strategy-guide.html#faq">FAQs</a> for possible solutions.');

            d3.select('body')
                .append('div')
                .attr('class', 'error-container')
                .append('div')
                .attr('class', 'error-container__message')
                .append('p')
                .html(message);
        }

        function createRadar() {

            try {
                document.title = "Radar de Tecnologias 2017";
                var all = RadarData;

                var blips = _.map(all, new InputSanitizer().sanitize);

                d3.selectAll(".loading").remove();

                var rings = _.map(_.uniqBy(blips, 'ring'), 'ring');
                var ringMap = {};
                var maxRings = 4;

                _.each(rings, function(ringName, i) {
                    if (i == maxRings) {
                        throw new MalformedDataError(ExceptionMessages.TOO_MANY_RINGS);
                    }
                    ringMap[ringName] = new Ring(ringName, i);
                });

                var quadrants = {};
                _.each(blips, function(blip) {
                    if (!quadrants[blip.quadrant]) {
                        quadrants[blip.quadrant] = new Quadrant(_.capitalize(blip.quadrant));
                    }
                    quadrants[blip.quadrant].add(new Blip(blip.name, ringMap[blip.ring], blip.isNew.toLowerCase() === 'true', blip.topic, blip.description))
                });

                var radar = new Radar();
                _.each(quadrants, function(quadrant) {
                    radar.addQuadrant(quadrant)
                });

                var size = (window.innerHeight - 133) < 620 ? 620 : window.innerHeight - 133;

                new GraphingRadar(size, radar).init().plot();

            } catch (exception) {
                displayErrorMessage(exception);
            }
        }
    };

    self.init = function() {
        var content = d3.select('body')
            .append('div')
            .attr('class', 'loading')
            .append('div')
            .attr('class', 'input-sheet');

        set_document_title();

        plotLogo(content);

        var bannerText = '<h1>Carregando o radar...</h1>';
        plotBanner(content, bannerText);
        plotFooter(content);


        return self;
    };

    return self;
};

var QueryParams = function(queryString) {
    var decode = function(s) {
        return decodeURIComponent(s.replace(/\+/g, " "));
    };

    var search = /([^&=]+)=?([^&]*)/g;

    var queryParams = {};
    var match;
    while (match = search.exec(queryString))
        queryParams[decode(match[1])] = decode(match[2]);

    return queryParams
};


const GoogleSheetInput = function() {
    var self = {};

    self.build = function() {
        var queryParams = QueryParams(window.location.search.substring(1));

        if (queryParams.sheetId) {
            var sheet = GoogleSheet(queryParams.sheetId, queryParams.sheetName);
            sheet.init().build();
        } else {
            var content = d3.select('body')
                .append('div')
                .attr('class', 'input-sheet');

            set_document_title();

            plotLogo(content);

            var bannerText = '<h1>Build your own radar</h1><p>Once you\'ve <a href ="https://info.thoughtworks.com/visualize-your-tech-strategy.html">created your Radar</a>, you can use this service' +
                ' to generate an <br />interactive version of your Technology Radar. Not sure how? <a href ="https://info.thoughtworks.com/visualize-your-tech-strategy-guide.html">Read this first.</a></p>';

            plotBanner(content, bannerText);

            plotForm(content);

            plotFooter(content);

        }
    };

    return self;
};

function set_document_title() {
    document.title = "Radar de Tecnologias";
}

function plotLogo(content) {
    content.append('div')
        .attr('class', 'input-sheet__logo')
        .html('<a href="https://www.thoughtworks.com"><img src="/images/logo.png" / ></a>');
}

function plotFooter(content) {
    content
        .append('div')
        .attr('id', 'footer')
        .append('div')
        .attr('class', 'footer-content')
        .append('p')
        .html('Powered by <a href="https://www.thoughtworks.com"> ThoughtWorks</a>. ' +
            'By using this service you agree to <a href="https://info.thoughtworks.com/visualize-your-tech-strategy-terms-of-service.html">ThoughtWorks\' terms of use</a>. ' +
            'You also agree to our <a href="https://www.thoughtworks.com/privacy-policy">privacy policy</a>, which describes how we will gather, use and protect any personal data contained in your public Google Sheet. ' +
            'This software is <a href="https://github.com/thoughtworks/build-your-own-radar">open source</a> and available for download and self-hosting.');



}

function plotBanner(content, text) {
    content.append('div')
        .attr('class', 'input-sheet__banner')
        .html(text);

}

function plotForm(content) {
    content.append('div')
        .attr('class', 'input-sheet__form')
        .append('p')
        .html('<strong>Enter the URL of your <a href="https://info.thoughtworks.com/visualize-your-tech-strategy-guide.html#publish-byor-sheet" target="_blank">published</a> Google Sheet below…</strong>');

    var form = content.select('.input-sheet__form').append('form')
        .attr('method', 'get');

    form.append('input')
        .attr('type', 'text')
        .attr('name', 'sheetId')
        .attr('placeholder', 'e.g. https://docs.google.com/spreadsheets/d/1waDG0_W3-yNiAaUfxcZhTKvl7AUCgXwQw8mdPjCz86U/');

    form.append('button')
        .attr('type', 'submit')
        .append('a')
        .attr('class', 'button')
        .text('Build my radar');

    form.append('p').html("<a href='https://info.thoughtworks.com/visualize-your-tech-strategy-guide.html#faq'>Need help?</a>");
}

module.exports = GoogleSheet;