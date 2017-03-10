require('./stylesheets/base.scss');
require('./images/logo.png');
require('./images/tech-radar-201611-landing-page-wide.png');
require('./images/favicon.png');
require('./images/radar_legend.png');

const GoogleSheetInput = require('./util/factory');

GoogleSheetInput().build();
