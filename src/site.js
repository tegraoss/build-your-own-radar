require('./stylesheets/base.scss');
require('./images/logo.png');
require('./images/tech-radar-201611-landing-page-wide.png');
require('./images/favicon.png');
require('./images/radar_legend.png');

const GoogleSheet = require('./util/factory');

GoogleSheet().build();