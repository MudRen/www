/*global self*/
/*jslint browser:true*/

(function () {

    "use strict";

    var boot_time, count_down, next, sync, sync_begin, time_offset;

    function cooldown(data) {
        var duration;

        if (time_offset !== undefined) {
            duration = data.time - time_offset - Date.now();

            if (duration > 0) {
                self.postMessage({ type : data.type, duration : duration });
            }
        }
    }

    function sync_time() {
        sync_begin = Date.now();

        self.postMessage(1);
    }

    function refresh(scheduled) {
        var minutes, seconds, uptime;

        if (!scheduled && next) {
            clearTimeout(next);
        }

        if (time_offset === undefined) {
            next = 0;
            return;
        }

        uptime = Date.now() + time_offset - boot_time;
        next = setTimeout(refresh, 1000 - (uptime % 1000), true);
        seconds = Math.floor(uptime / 1000);

        if (count_down) {
            seconds = 900 - (seconds % 900);
        } else {
            seconds = seconds % 3600;
        }

        minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;

        self.postMessage((minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds);

        if (scheduled) {
            if (sync) {
                sync -= 1;
            } else {
                sync_time();
            }
        }
    }

    function update_offset(remote) {
        var current = Date.now();

        time_offset = remote - Math.round((sync_begin + current) / 2);
        sync = Math.abs(time_offset) > 200 ? 12 : 200;

        refresh(false);
    }

    self.onmessage = function (event) {
        switch (typeof event.data) {
        case "boolean":
            count_down = event.data;
            refresh(false);
            break;
        case "number":
            switch (event.data) {
            case 0:
                boot_time = undefined;
                time_offset = undefined;
                break;
            case 1:
                sync_time();
                break;
            default:
                boot_time = event.data;
            }
            break;
        case "object":
            cooldown(event.data);
            break;
        case "string":
            if (boot_time) {
                update_offset(parseInt(event.data, 10));
            }
            break;
        }
    };

}());
