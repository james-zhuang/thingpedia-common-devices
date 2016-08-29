// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// Copyright 2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//                Andrei Bajenov <abajenov@stanford.edu>
//                Darshan Kapashi <darshank@stanford.edu>
//
// See LICENSE for details
"use strict";

const Tp = require('thingpedia');

const URL = 'https://api.met.no/weatherapi/sunrise/1.0/?lat=%f;lon=%f;date=%04d-%02d-%02d';

module.exports = new Tp.ChannelClass({
    Name: 'WeatherAPIMoon',

    _init(engine, device) {
        this.parent(engine, device);
        this.engine = engine;
    },

    formatEvent(event, filters) {
        var location = event[0];
        var date = event[1];
        var rise = event[2];
        var set = event[3];
        var phase = event[4];
        var dateWasSet = filters[1] !== undefined;

        var locale = this.engine.platform.locale;
        var timezone = this.engine.platform.timezone;

        var riseString = rise.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
            timeZone: timezone
        });
        var setString = set.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
            timeZone: timezone
        });

        if (dateWasSet) {
            return "Moon phase on %s for [Location %.2f, %.2f]: %s. Rises at %s, sets at %s".
                format(date.toLocaleDateString(locale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: timezone
                }, location.y, location.x, phase, riseString, setString));
        } else {
            return "Current moon phase for [Location %.2f, %.2f]: %s. Rises at %s, sets at %s".
                format(location.y, location.x, phase, riseString, setString);
        }
    },

    invokeQuery(filters) {
        var location = filters[0];
        var date = filters[1];
        if (!location)
            throw new TypeError('Missing required parameter');
        if (date === undefined || date === null)
            date = new Date;

        var url = URL.format(location.y, location.x, date.getFullYear(), date.getMonth()+1, date.getDate());

        return Tp.Helpers.Http.get(url).then((response) => {
            return Tp.Helpers.Xml.parseString(response);
        }).then((parsed) => {
            var moon = parsed.astrodata.time[0].location[0].moon[0];
            var rise = moon.$.rise;
            var set = moon.$.set;
            var phase = moon.$.phase

            return [[location, date, new Date(rise), new Date(set), phase]];
        });
    },

});
