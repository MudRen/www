/*global Uint8Array, WebSocket, Worker, window*/
/*jslint bitwise:true, browser:true, continue:true, plusplus:true*/

(function (document, window) {

    "use strict";

    //------------------------------------------------------------- Declaration

    var A = document.createElement("A"),
        B = document.createElement("B"),
        SPAN = document.createElement("SPAN"),
        auto_login = document.getElementById("auto_login"),
        background_color = "",
        backup_setting = document.getElementById("backup_setting"),
        blink = "",
        bottom,
        bright = "N",
        channel = document.getElementById("channel"),
        char_id,
        classes = document.body.classList,
        clean_command = document.getElementById("clean_command"),
        clean_up,
        cls,
        commands = [],
        config,
        connect = document.getElementById("connect"),
        connector,
        content = document.getElementById("content"),
        current = {},
        custom_macro,
        default_macro,
        delay = document.getElementById("delay"),
        echo = true,
        font = document.getElementById("font"),
        frozen,
        gmcp_handlers = {},
        history = [],
        hp = document.getElementById("hp"),
        input = document.getElementById("input"),
        inspiration = "",
        italic = "",
        keys = [],
        key_map,
        key_values,
        left,
        location = JSON.parse(localStorage.LOCATIONS || "{}"),
        macro_table = document.getElementById("macro_table").style,
        main = document.getElementById("main"),
        map = document.getElementById("map"),
        maps = {},
        map_chars = {},
        map_header = document.getElementById("map_header").firstElementChild,
        map_table = document.getElementById("map_table").style,
        max_bottom,
        max_left,
        max_right,
        max_top,
        message = document.getElementById("message"),
        min_bottom,
        min_left,
        min_right,
        min_top,
        mobile,
        monitor = document.getElementById("monitor").style,
        msg_data,
        msg_time,
        msg_type,
        msg_window,
        mxp_tag,
        mxp_room,
        next_class_name,
        node = document.createDocumentFragment(),
        nodes = message.childNodes,
        notice = document.getElementById("notice"),
        paragraph = node,
        password = document.getElementById("password"),
        wpassword = document.getElementById("wpassword"),
        pending = "",
        position = 0,
        range = document.createRange(),
        reborn_audio = document.getElementById("reborn_audio"),
        restore_setting = document.getElementById("restore_setting"),
        right,
        setting_table = document.getElementById("setting_table").style,
        socket,
        target,
        text_color = 7,
        timer,
        timestamps = [],
        top,
        translucent = document.getElementById("translucent"),
        underline = "",
        uptime = document.getElementById("uptime"),
        url_pattern = /\bhttps?:\/\/[-\w+&@#\/%?=~|!:,.;]*[-\w+&@#\/%=~|]/g,
        username = document.getElementById("username"),
        vitals,
        z_index = 0,
        default_grid = map_header.getAttribute("data-default-grid");

    //------------------------------------------------------------------- UTF-8

    function parse_utf8(stream, index, value, buffer) {
        var result;

        do {
            // 1110 0000    3字节
            if ((value >> 4) === 0x0E) {
                value = ((value & 0x0F) << 12)
                    | ((stream[++index] & 0x3F) << 6)
                    | (stream[++index] & 0x3F);
            // 1100 0000    2字节
            } else if ((value >> 5) === 0x06) {
                value = ((value & 0x1F) << 6)
                    | (stream[++index] & 0x3F);
            // 1111 0000    4字节
            } else if ((value >> 3) === 0x1E) {
                value = ((value & 0x07) << 18)
                    | ((stream[++index] & 0x3F) << 12)
                    | ((stream[++index] & 0x3F) << 6)
                    | (stream[++index] & 0x3F);
            // 1111 1000    5字节
            } else if ((value >> 2) === 0x3E) {
                value = ((value & 0x03) << 24)
                    | ((stream[++index] & 0x3F) << 18)
                    | ((stream[++index] & 0x3F) << 12)
                    | ((stream[++index] & 0x3F) << 6)
                    | (stream[++index] & 0x3F);
            // 1111 1100    6字节
            } else if ((value >> 1) === 0x7E) {
                value = ((value & 0x01) << 30)
                    | ((stream[++index] & 0x3F) << 24)
                    | ((stream[++index] & 0x3F) << 18)
                    | ((stream[++index] & 0x3F) << 12)
                    | ((stream[++index] & 0x3F) << 6)
                    | (stream[++index] & 0x3F);
            } else {
                // 1字节(ASCII字符)
                break;
            }

            buffer.push(value);
            result = index;
            value = stream[++index];
        } while (value > 0xBF);

        return result;
    }

    //-------------------------------------------------------------------------

    function to_string(stream, start, end) {
        var buffer, index, result, value;

        buffer = [];

        for (index = start; index < end; ++index) {
            value = stream[index];

            if (value > 0xBF) {
                result = parse_utf8(stream, index, value, buffer);

                if (result) {
                    index = result;
                    continue;
                }
            }

            buffer.push(value);
        }

        return String.fromCharCode.apply(null, buffer);
    }

    //-------------------------------------------------------- ANSI escape code

    function parse_mxp_tag(stream, index) {
        var end = stream.indexOf(0x3B, ++index);

        if (end > 0) {
            mxp_tag = to_string(stream, index, end).split(":");

            return end;
        }
    }
    function parse_mxp_room(stream, index) {
        var end = stream.indexOf(0x3B, ++index);

        if (end > 0) {
            mxp_room = to_string(stream, index, end).split(":");

            return end;
        }
    }

    //-------------------------------------------------------------------------

    function select_graphic_rendition(values) {
        var index, length;

        length = values.length;

        for (index = 0; index < length; ++index) {
            switch (values[index]) {
                case 0x00:
                    background_color = blink = italic = underline = "";
                    bright = "N";
                    text_color = 7;
                    break;
                case 0x01:
                    bright = "H";
                    break;
                case 0x02:
                    bright = "N";
                    break;
                case 0x03:
                    italic = " I";
                    break;
                case 0x04:
                    underline = " U";
                    break;
                case 0x05:
                case 0x06:
                    blink = " K";
                    break;
                case 0x20:
                    italic = " I";
                    break;
                case 0x21:
                case 0x22:
                    bright = "N";
                    break;
                case 0x23:
                    italic = "";
                    break;
                case 0x24:
                    underline = "";
                    break;
                case 0x25:
                    blink = "";
                    break;
                case 0x30:
                    text_color = 0;
                    break;
                case 0x31:
                    text_color = 1;
                    break;
                case 0x32:
                    text_color = 2;
                    break;
                case 0x33:
                    text_color = 3;
                    break;
                case 0x34:
                    text_color = 4;
                    break;
                case 0x35:
                    text_color = 5;
                    break;
                case 0x36:
                    text_color = 6;
                    break;
                case 0x37:
                case 0x39:
                    text_color = 7;
                    break;
                case 0x40:
                    background_color = "";
                    break;
                case 0x41:
                    background_color = " B1";
                    break;
                case 0x42:
                    background_color = " B2";
                    break;
                case 0x43:
                    background_color = " B3";
                    break;
                case 0x44:
                    background_color = " B4";
                    break;
                case 0x45:
                    background_color = " B5";
                    break;
                case 0x46:
                    background_color = " B6";
                    break;
                case 0x47:
                    background_color = " B7";
                    break;
                case 0x49:
                    background_color = "";
                    break;
                case 0x58:
                    inspiration = " X";
                    break;
                case 0x59:
                    inspiration = "";
                    break;
            }
        }
    }

    //-------------------------------------------------------------------------

    function parse_ansi(stream, length, index) {
        var value, values;

        if (stream[++index] !== 0x5B) {
            return;
        }

        value = 0;
        values = [];

        while (++index < length) {
            switch (stream[index]) {
                case 0x30:
                    value = value << 4;
                    break;
                case 0x31:
                    value = (value << 4) | 0x1;
                    break;
                case 0x32:
                    value = (value << 4) | 0x2;
                    break;
                case 0x33:
                    value = (value << 4) | 0x3;
                    break;
                case 0x34:
                    value = (value << 4) | 0x4;
                    break;
                case 0x35:
                    value = (value << 4) | 0x5;
                    break;
                case 0x36:
                    value = (value << 4) | 0x6;
                    break;
                case 0x37:
                    value = (value << 4) | 0x7;
                    break;
                case 0x38:
                    value = (value << 4) | 0x8;
                    break;
                case 0x39:
                    value = (value << 4) | 0x9;
                    break;
                case 0x3B:
                    values.push(value);
                    value = 0;
                    break;
                case 0x4A:
                    if (value !== 0x2 || values.length) {
                        return;
                    }
                    cls = true;
                    return index;
                case 0x6D:
                    values.push(value);
                    select_graphic_rendition(values);
                    return index;
                case 0x41:
                case 0x44:
                case 0x48:
                case 0x4B:
                case 0x73:
                case 0x75:
                    return index;
                case 0x7A:
                    if (value !== 0x4 || values.length) {
                        return;
                    }
                    return parse_mxp_tag(stream, index);
                case 0x7B:
                    if (value !== 0x4 || values.length) {
                        return;
                    }
                    return parse_mxp_room(stream, index);

                default:
                    return;
            }
        }
    }

    //----------------------------------------------------------------- Element

    function restore_button_text(button) {
        button.textContent = button.value;
        button.value = "";
    }

    //-------------------------------------------------------------------------

    function set_bottom(style, value) {
        if (value > max_bottom) {
            value = max_bottom;
        } else if (value < min_bottom) {
            value = min_bottom;
        }

        style.bottom = value + "px";
    }

    //-------------------------------------------------------------------------

    function set_left(style, value) {
        if (value > max_left) {
            value = max_left;
        } else if (value < min_left) {
            value = min_left;
        }

        style.left = value + "px";
    }

    //-------------------------------------------------------------------------

    function set_right(style, value) {
        if (value > max_right) {
            value = max_right;
        } else if (value < min_right) {
            value = min_right;
        }

        style.right = value + "px";
    }

    //-------------------------------------------------------------------------

    function set_text_content(element, attribute) {
        element.textContent = element.getAttribute("data-" + attribute);
    }

    //-------------------------------------------------------------------------

    function set_top(style, value) {
        if (value > max_top) {
            value = max_top;
        } else if (value < min_top) {
            value = min_top;
        }

        style.top = value + "px";
    }

    //--------------------------------------------------------------------- Map

    function move_map() {
        var id, room;

        id = "m-" + current.location.map;

        if (current.map && current.map.id !== id) {
            current.map.className = "invisible";
            current.map = null;
        }

        if (!current.map) {
            current.map = document.getElementById(id);

            if (current.map) {
                current.map.className = "";
                map_header.textContent = maps[current.location.map].title;
                send_gmcp("sync_map " + current.location.map + "@" + current.location.instance);
            } else {
                map_header.textContent = "";
                return;
            }
        }

        room = document.getElementById(id + "-" + current.location.code);

        if (room) {
            current.map.style.left = -room.offsetLeft + "px";
            current.map.style.top = -room.offsetTop + "px";
        }
    }

    //-------------------------------------------------------------------------

    function draw_map(data) {
        var buffer, canvas, id;

        function draw_grid(grid) {
            var param;

            if (typeof grid === "number") {
                param = map_chars[grid];

                if (!param) {
                    map_chars[grid] = param = String.fromCharCode(grid);
                }

                buffer.push(param);
            } else {
                param = data.param[grid] || {};

                buffer.push("<b class=\"");
                buffer.push(param.cn || "H7");
                buffer.push("\" id=\"");
                buffer.push(id);
                buffer.push("-");
                buffer.push(grid);
                buffer.push("\">");
                buffer.push(param.dn || default_grid);
                buffer.push("</b>");
            }
        }

        function draw_row(row) {
            row.forEach(draw_grid);

            buffer.push("\n");
        }

        buffer = [];
        id = "m-" + data.name;
        canvas = document.getElementById(id);

        if (!canvas) {
            canvas = document.createElement("DIV");
            canvas.className = "invisible";
            canvas.id = id;

            document.getElementById("map_wrapper").appendChild(canvas);
        }

        data.map.forEach(draw_row);

        canvas.innerHTML = buffer.join("");

        if (config.display_map) {
            move_map();
        }
    }

    //-------------------------------------------------------------------------

    function clean_cell(cell) {
        cell.classList.remove("B5");
        cell.title = "";
    }

    //-------------------------------------------------------------------------

    function set_cell(cell, players) {
        cell.classList.add("B5");
        cell.title = players.join();
    }

    //----------------------------------------------------------------- Content

    function toggle_frozen() {
        frozen = classes.toggle("frozen");

        if (frozen) {
            content.scrollTop = 10000000;
        }

        return false;
    }

    //-------------------------------------------------------------------------

    function wrap_url(wrapper, match) {
        var anchor, idx, text;

        while (wrapper.firstChild) {
            wrapper.removeChild(wrapper.firstChild);
        }

        idx = 0;
        text = match.input;

        while (match) {
            if (idx !== match.index) {
                wrapper.appendChild(document.createTextNode(text.substring(idx, match.index)));
            }

            anchor = A.cloneNode(false);
            anchor.className = "url";
            anchor.href = match[0];
            anchor.tabIndex = -1;
            anchor.target = "_blank";
            anchor.textContent = match[0];

            wrapper.appendChild(anchor);

            idx = url_pattern.lastIndex;
            match = url_pattern.exec(text);
        }

        text = text.substring(idx);

        if (text) {
            wrapper.appendChild(document.createTextNode(text));
        }

        return wrapper;
    }

    //-------------------------------------------------------------------------

    function write_text(text) {
        var child = node.lastChild;
        // console.log(text);
        if (child) {
            if (child.nodeType === 3) {
                child.appendData(text);
            } else {
                node.appendChild(document.createTextNode(text));
            }
        } else {
            node.textContent = text;
        }
    }

    //-------------------------------------------------------------------------

    function clean_up_message() {
        var overflow = nodes.length - (frozen ? 10000 : 5000);

        if (overflow > 0) {
            range.setStartBefore(nodes[0]);
            range.setEndBefore(nodes[overflow]);
            range.deleteContents();
        }

        clean_up = 0;
    }

    //-------------------------------------------------------------------------

    function cooldown(data) {
        var element = document.getElementById(data.type);

        if (element) {
            element.innerHTML = "<div style=\"animation-duration:"
                + data.duration
                + "ms;-webkit-animation-duration:"
                + data.duration
                + "ms;\"></div>";
        }
    }

    //-------------------------------------------------------------------------

    function empty_message() {
        range.selectNodeContents(message);
        range.deleteContents();

        return false;
    }

    //-------------------------------------------------------------------------

    function execute_command(command) {
        if (connector) {
            if (frozen) {
                toggle_frozen();
            }

            command = command ? (command + "\n") : "\r\n";

            // if (echo) {
            //     write_text(command);
            // }

            if (char_id) {
                timestamps.push(Date.now());
            }

            connector.send(command);
        }

        return false;
    }

    //-------------------------------------------------------------------------

    function filter_char_id(id) {
        return id !== char_id;
    }

    //-------------------------------------------------------------------------

    function flush_message() {
        var child, match, text, wrapper;

        if (node !== paragraph) {
            if (!next_class_name) {
                next_class_name = node.className;
            }

            node = paragraph;
        }

        for (child = node.firstChild; child; child = child.nextSibling) {
            if (child.nodeType === 3) {
                text = child.textContent;
                wrapper = null;
            } else if (!child.firstElementChild && child.firstChild) {
                text = child.firstChild.textContent;
                wrapper = child;
            } else {
                continue;
            }

            if (text.length > 12) {
                match = url_pattern.exec(text);

                if (match) {
                    if (!wrapper) {
                        wrapper = SPAN.cloneNode(false);
                        paragraph.replaceChild(wrapper, child);
                        child = wrapper;
                    }

                    wrap_url(child, match);
                }
            }
        }

        message.appendChild(paragraph);

        if (clean_up) {
            clearTimeout(clean_up);
        }

        clean_up = setTimeout(clean_up_message, 200);
    }

    //-------------------------------------------------------------------------

    function scroll_content(delta) {
        if (!frozen && delta < 0
            && content.clientHeight < message.clientHeight) {
            toggle_frozen();
        }

        if (frozen) {
            content.scrollTop += delta;

            if (delta > 0) {
                if (content.scrollHeight <= content.scrollTop + content.clientHeight) {
                    toggle_frozen();
                }
            }
        }

        return false;
    }

    //-------------------------------------------------------------------------

    function set_char_id(id) {
        char_id = id;

        document.title = document.title.replace(/^.*- /, "");

        if (char_id) {
            document.title = char_id + " - " + document.title;

            if (msg_window) {
                if (msg_window.name === "msg-" + char_id) {
                    classes.add("display_channel");
                } else {
                    msg_window = null;
                }
            }

            timer.postMessage(1);
        } else {
            timer.postMessage(0);
        }
    }

    //-------------------------------------------------------------------------

    function set_response_time() {
        if (timestamps.length) {
            delay.textContent = (Date.now() - timestamps.shift()) + "ms";
        }
    }

    //-------------------------------------------------------------------------

    function toggle_macro() {
        config.display_macro = classes.toggle("display_macro");

        if (config.display_macro) {
            macro_table.zIndex = ++z_index;
        }

        return false;
    }

    //-------------------------------------------------------------------------

    function toggle_map() {
        if (char_id) {
            config.display_map = classes.toggle("display_map");

            if (config.display_map) {
                map_table.zIndex = ++z_index;

                move_map();
            }
        }

        return false;
    }

    //-------------------------------------------------------------------------

    function toggle_monitor() {
        if (char_id) {
            config.display_monitor = classes.toggle("display_monitor");

            if (config.display_monitor) {
                monitor.zIndex = ++z_index;

                window.update_vitals(vitals);
            }
        }

        return false;
    }

    //-------------------------------------------------------------------------

    function toggle_setting() {
        config.display_setting = classes.toggle("display_setting");

        if (config.display_setting) {
            setting_table.zIndex = ++z_index;
        }

        return false;
    }

    //-------------------------------------------------------------------------

    function update_class_name() {
        if (next_class_name === "N7") {
            next_class_name = undefined;
        }

        if (node.className !== next_class_name) {
            if (next_class_name) {
                node = SPAN.cloneNode(false);
                node.className = next_class_name;

                paragraph.appendChild(node);
            } else {
                node = paragraph;
            }
        }

        next_class_name = undefined;
    }

    //-------------------------------------------------------------------------

    function write_message(buffer, invisible) {
        var data = String.fromCharCode.apply(null, buffer);

        if (next_class_name) {
            if (!invisible || invisible !== buffer.length) {
                update_class_name();
            }
        }

        write_text(data);

        if (msg_type) {
            msg_window.add_message(node.className, msg_time, data);
            msg_time = null;
        }
    }

    //-------------------------------------------------------------------------

    function write_mxp_tag() {
        var tag = A.cloneNode(false);

        tag.target = mxp_tag[0];
        tag.textContent = mxp_tag[1];

        if (next_class_name) {
            update_class_name();
        }

        node.appendChild(tag);

        mxp_tag = null;
    }

    function write_mxp_room() {
        var room = SPAN.cloneNode(false);

        room.target = mxp_room[0];
        room.textContent = mxp_room[1];

        if (next_class_name) {
            update_class_name();
        }

        node.appendChild(room);

        mxp_room = null;
    }

    //-------------------------------------------------------------- Connection

    function reconnect(seconds) {
        if (!socket && auto_login.checked
            && username.value
            && password.value) {
            if (seconds) {
                notice.classList.remove("invisible");
                notice.firstChild.nodeValue = seconds;

                setTimeout(reconnect, 1000, --seconds);
            } else {
                connect.click();
            }
        }
    }

    //-------------------------------------------------------------------------

    function connecting(event) {
        connect.className = "pressed";
        connector = event.target;
    }

    //-------------------------------------------------------------------------

    function disconnect() {
        backup_setting.disabled = true;
        channel.disabled = true;
        connect.className = "B7";
        connector = null;
        delay.textContent = "";
        hp.disabled = true;
        map.disabled = true;
        restore_setting.disabled = true;
        timestamps = [];
        uptime.firstChild.nodeValue = "";

        classes.remove("display_monitor", "display_map", "display_channel");

        set_char_id(null);

        if (socket !== null) {
            socket = null;
            reconnect(10);
        }
    }

    //-------------------------------------------------------------------------

    function send_binary(data) {
        connector.send(new Uint8Array(data).buffer);
    }

    //-------------------------------------------------------------------------

    function send_gmcp(data) {
        send_binary([255, 250, 201]);
        echo = false;
        setTimeout(execute_command, 0, data);
        echo = true;
        send_binary([255, 240]);
    }

    //----------------------------------------------------------- Configuration

    function change_color_class(event) {
        document.documentElement.className = config.color_name
            = event.target.value;

        if (msg_window) {
            msg_window.change_color_class();
        }
    }

    //-------------------------------------------------------------------------

    function load_configuration(source) {
        var index, names;

        if (source) {
            config = source;
        } else {
            config = JSON.parse(localStorage.CONFIGURATIONS || "{}");
        }

        font.value = config.font || "";
        font.oninput();

        document.documentElement.className = config.color_name || "XTerm";

        names = document.getElementsByName("color_name");

        for (index = 0; index < names.length; ++index) {
            if (names[index].value === document.documentElement.className) {
                names[index].checked = true;
            } else {
                names[index].checked = false;
            }

            names[index].onchange = change_color_class;
        }

        clean_command.checked = config.clean_command || false;
        translucent.checked = config.translucent_monitor || false;
        reborn_audio.checked = config.reborn_audio || false;
        auto_login.checked = config.auto_login || false;
        uptime.className = config.count_down ? "H1" : "H7";

        timer.postMessage(config.count_down);
        translucent.onchange();

        if (classes.contains("display_macro") !== !!config.display_macro) {
            toggle_macro();
        }

        if (classes.contains("display_setting") !== !!config.display_setting) {
            toggle_setting();
        }

        if (classes.contains("display_monitor") !== !!config.display_monitor) {
            toggle_monitor();
        }

        if (classes.contains("display_map") !== !!config.display_map) {
            toggle_map();
        }
    }

    //-------------------------------------------------------------------------

    function save_configuration() {
        config.font = font.value;
        config.clean_command = clean_command.checked;
        config.translucent_monitor = translucent.checked;
        config.reborn_audio = reborn_audio.checked;
        config.auto_login = auto_login.checked;

        localStorage.CONFIGURATIONS = JSON.stringify(config);

        return config;
    }

    //------------------------------------------------------------------- Macro

    function save_custom_macro() {
        var index, length, source;

        length = keys.length;
        source = [];

        for (index = 0; index < length; ++index) {
            if (keys[index].name || commands[index].value) {
                source.push([keys[index].name, commands[index].value]);
            } else {
                source.push(0);
            }
        }

        localStorage.MACROS = JSON.stringify(source);

        return source;
    }

    //-------------------------------------------------------------------------

    function auto_complete() {
        var index, value;

        value = input.value;

        for (index = history.length - position - 1; index >= 0; --index) {
            if (history[index].indexOf(value) === 0) {
                input.value = history[index];
                input.select();

                position = history.length - index;

                break;
            }
        }
    }

    //-------------------------------------------------------------------------

    function execute_macro(value) {
        var command = custom_macro[value] || default_macro[value];

        if (command) {
            if (typeof command === "string") {
                command.split(/\s*;\s*/).forEach(execute_command);

                return false;
            }

            return command();
        }
    }

    //-------------------------------------------------------------------------

    function get_key_value(event) {
        var value = key_values[event.which];

        if (value) {
            return (event.metaKey ? 2048 : 0)
                | (event.ctrlKey ? 1024 : 0)
                | (event.altKey ? 512 : 0)
                | (event.shiftKey ? 256 : 0)
                | value;
        }
    }

    //-------------------------------------------------------------------------

    function get_macro_name(value) {
        return (value & 2048 ? "Meta+" : "")
            + (value & 1024 ? "Ctrl+" : "")
            + (value & 512 ? "Alt+" : "")
            + (value & 256 ? "Shift+" : "")
            + key_map[value & 0xFF];
    }

    //-------------------------------------------------------------------------

    function history_backward() {
        if (position > 0) {
            if (--position) {
                input.value = history[history.length - position];
            } else {
                input.value = pending;
            }

            input.select();
        }

        return false;
    }

    //-------------------------------------------------------------------------

    function history_forward() {
        if (position < history.length) {
            if (!position) {
                pending = input.value;
            }

            ++position;

            input.value = history[history.length - position];
            input.select();
        }

        return false;
    }

    //-------------------------------------------------------------------------

    function load_custom_macro(source) {
        var data, index, length;

        if (!source) {
            source = JSON.parse(localStorage.MACROS || "[]");
        }

        custom_macro = {};
        length = keys.length;

        for (index = 0; index < length; ++index) {
            data = source[index];

            if (data && data[0]) {
                keys[index].defaultValue = keys[index].value
                    = get_macro_name(data[0]);
                keys[index].name = data[0];

                custom_macro[data[0]] = data[1];
            } else {
                keys[index].defaultValue = keys[index].value
                    = keys[index].name = "";
            }

            commands[index].value = data ? data[1] : "";
        }
    }

    //-------------------------------------------------------------------------

    function on_macro_command_change(event) {
        var element, value;

        element = event.target;
        value = element.previousSibling.name;

        if (value) {
            custom_macro[value] = element.value;
        }

        save_custom_macro();
    }

    //-------------------------------------------------------------------------

    function on_macro_key_change(event) {
        var element = event.target;

        if (element.value !== element.defaultValue) {
            element.value = element.defaultValue;
        }
    }

    //-------------------------------------------------------------------------

    function on_macro_key_down(event) {
        var element, index, length, value;

        element = event.target;
        value = get_key_value(event);

        if (value) {
            length = keys.length;
            value = value.toString();

            for (index = 0; index < length; ++index) {
                if (keys[index].name === value) {
                    return false;
                }
            }

            if (element.name) {
                custom_macro[element.name] = null;
            }

            element.defaultValue = element.value = get_macro_name(value);
            element.name = value;

            custom_macro[value] = element.nextSibling.value;

            save_custom_macro();
        } else {
            if (event.which === 8) {
                if (element.name) {
                    custom_macro[element.name] = null;
                    element.defaultValue = element.value = element.name = "";

                    save_custom_macro();
                }
            }
        }

        return false;
    }

    //------------------------------------------------------------------ Telnet

    function process_gmcp(stream, start, end) {
        var handler, index;

        for (index = start; index < end; ++index) {
            if (stream[index] === 0x20) {
                break;
            }
        }

        handler = gmcp_handlers[to_string(stream, start, index)];

        if (handler) {
            handler(to_string(stream, ++index, end));
        }
    }

    //-------------------------------------------------------------------------

    function parse_iac_do(stream, index) {
        switch (stream[++index]) {
            case 91:
                send_binary([255, 251, 91]);
                break;
        }

        return index;
    }

    //-------------------------------------------------------------------------

    function parse_iac_dont(stream, index) {
        return ++index;
    }

    //-------------------------------------------------------------------------

    function parse_iac_will(stream, index) {
        switch (stream[++index]) {
            case 1:
                echo = false;
                break;
            case 201:
                send_binary([255, 253, 201]);
                break;
        }

        return index;
    }

    //-------------------------------------------------------------------------

    function parse_iac_wont(stream, index) {
        switch (stream[++index]) {
            case 1:
                echo = true;
                break;
        }

        return index;
    }

    //-------------------------------------------------------------------------

    function parse_sub_negotiation(stream, index) {
        var start, type;

        type = stream[++index];
        start = ++index;

        while (true) {
            index = stream.indexOf(255, index);

            if (index < 0) {
                return;
            }

            if (stream[++index] === 240) {
                if (type === 201) {
                    process_gmcp(stream, start, index - 1);
                }

                return index;
            }
        }
    }

    //-------------------------------------------------------------------------

    function parse_iac(stream, index, buffer) {
        // console.log(stream[index + 1]);
        switch (stream[++index]) {
            case 249:
                set_response_time();
                break;
            case 250:
                return parse_sub_negotiation(stream, index);
            case 251:
                return parse_iac_will(stream, index);
            case 252:
                return parse_iac_wont(stream, index);
            case 253:
                return parse_iac_do(stream, index);
            case 254:
                return parse_iac_dont(stream, index);
            case 255:
                buffer.push(255);
                break;
        }

        return index;
    }

    //------------------------------------------------------------------ Stream

    function process_stream(event) {
        var buffer, index, invisible, length, result, stream, value;

        buffer = [];
        invisible = 0;
        stream = new Uint8Array(event.data);
        length = stream.length;

        // let enc = new TextDecoder('utf-8');
        // let msg = enc.decode(stream);
        // console.log(msg);

        for (index = 0; index < length; ++index) {
            value = stream[index];

            if (value > 0xBF) {
                result = parse_utf8(stream, index, value, buffer);

                if (result) {
                    index = result;
                    continue;
                }
                // IAC
                if (value === 255) {
                    // console.log(value);
                    result = parse_iac(stream, index, buffer);

                    if (result) {
                        if (msg_data) {
                            if (buffer.length) {
                                write_message(buffer, invisible);
                                buffer = [];
                                invisible = 0;
                            }

                            msg_type = msg_data.type;
                            msg_time = msg_data.time;
                            msg_data = null;
                        }

                        index = result;
                        continue;
                    }
                }
            } else if (value < 0x1C) {
                switch (value) {
                    case 7:
                        // document.getElementById("beep").play();
                        continue;
                    case 10:
                        invisible++;
                        break;
                    case 13:
                        continue;
                    // ESC(\0x1b)
                    case 27:
                        result = parse_ansi(stream, length, index);
                        if (result) {
                            if (buffer.length) {
                                write_message(buffer, invisible);
                                buffer = [];
                                invisible = 0;
                            }
                            if (mxp_tag) {
                                write_mxp_tag();
                            } else
                                if (mxp_room) {
                                    write_mxp_room();
                                } else
                                    if (cls) {
                                        cls = false;
                                        empty_message();
                                    } else {
                                        next_class_name = bright + text_color
                                            + background_color
                                            + blink
                                            + italic
                                            + underline
                                            + inspiration;
                                    }
                            index = result;
                            continue;
                        }
                        break;
                }
            }

            buffer.push(value);
        }

        if (buffer.length) {
            write_message(buffer, invisible);
        }

        if (paragraph.firstChild) {
            flush_message();
        }
    }

    //-------------------------------------------------------------- Initialize

    if (!window.Uint8Array || !window.WebSocket || !window.Worker) {
        set_text_content(content, "unsupported");
        return;
    }

    if (!Uint8Array.prototype.indexOf) {
        Uint8Array.prototype.indexOf = Array.prototype.indexOf;
    }

    default_macro = {
        "27": function () { input.value = ""; return false; },
        "33": function () { return scroll_content(-480); },
        "34": function () { return scroll_content(480); },
        "38": history_forward,
        "40": history_backward,
        "289": "northeast",
        "290": "southeast",
        "291": "southwest",
        "292": "northwest",
        "293": "west",
        "294": "north",
        "295": "east",
        "296": "south",
        "1096": toggle_monitor,
        "1100": toggle_frozen,
        "1101": toggle_macro,
        "1104": toggle_setting,
        "1368": empty_message
    };

    key_map = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, "Esc", 0, 0,
        0, 0, 0, "PageUp", "PageDown", "End", "Home", "Left", "Up", "Right",
        "Down", 0, 0, 0, 0, "Insert", "Delete", 0, "0", "1",
        "2", "3", "4", "5", "6", "7", "8", "9", 0, 0,
        0, 0, 0, 0, 0, "A", "B", "C", "D", "E",
        "F", "G", "H", "I", "J", "K", "L", "M", "N", "O",
        "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y",
        "Z", 0, 0, 0, 0, 0, "n0", "n1", "n2", "n3",
        "n4", "n5", "n6", "n7", "n8", "n9", "n*", "n+", 0, "n-",
        "n.", "n/", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8",
        "F9", "F10", "F11", "F12", 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, ";", "=", ",", "-",
        ".", "/", "`", 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, "[",
        "\\", "]", "'", 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0
    ];

    key_values = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 27, 0, 0,
        0, 0, 0, 33, 34, 35, 36, 37, 38, 39,
        40, 0, 0, 0, 0, 45, 46, 0, 48, 49,
        50, 51, 52, 53, 54, 55, 56, 57, 0, 186,
        0, 187, 0, 0, 0, 65, 66, 67, 68, 69,
        70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
        80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
        90, 0, 0, 0, 0, 0, 96, 97, 98, 99,
        100, 101, 102, 103, 104, 105, 106, 107, 0, 109,
        110, 111, 112, 113, 114, 115, 116, 117, 118, 119,
        120, 121, 122, 123, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 189, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 186, 187, 188, 189,
        190, 191, 192, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 219,
        220, 221, 222, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0
    ];

    //-------------------------------------------------------------------------

    min_bottom = window.innerHeight
        - main.offsetTop
        - main.clientTop
        - main.clientHeight
        + 3;

    min_left = main.offsetLeft
        + main.clientLeft
        + 3;

    min_right = window.innerWidth
        - main.offsetLeft
        - main.clientLeft
        - main.clientWidth
        + 3;

    min_top = main.offsetTop
        + main.clientTop
        + 3;

    //-------------------------------------------------------------------------

    backup_setting.disabled = true;
    channel.disabled = true;
    hp.disabled = true;
    map.disabled = true;
    restore_setting.disabled = true;
    wpassword.value = localStorage.WPASSWORD || "";
    password.value = localStorage.PASSWORD || "";
    username.value = localStorage.USERNAME || "";

    location.macro = location.macro || [min_right, min_top];
    location.map = location.map || [min_bottom, min_left];
    location.monitor = location.monitor || [min_bottom, min_right];
    location.setting = location.setting || [min_left, min_top];

    //-------------------------------------------------------------------------

    timer = new Worker("/js/timer.js");

    timer.onmessage = function (event) {
        switch (typeof event.data) {
            case "number":
                send_gmcp("sync_time");
                break;
            case "object":
                cooldown(event.data);
                break;
            case "string":
                uptime.firstChild.nodeValue = event.data;
                if (reborn_audio.checked) {
                    switch (event.data) {
                        case '00:00':
                        case '15:00':
                        case '30:00':
                        case '45:00':
                            // document.getElementById("reborn").play();
                            console.log('reborn : ' + event.data);
                    }
                }
                break;
        }
    };

    //-------------------------------------------------------------------- GMCP

    gmcp_handlers["auto-login.confirm"] = function () {
        if (auto_login.checked) {
            setTimeout(execute_command, 0, "y");
        }
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["auto-login.disable"] = function () {
        auto_login.checked = false;
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["auto-login.password"] = function () {
        if (auto_login.checked && password.value) {
            setTimeout(execute_command, 0, password.value);
        }
    };
    //-------------------------------------------------------------------------

    gmcp_handlers["auto-login.wpassword"] = function () {
        if (auto_login.checked && wpassword.value) {
            setTimeout(execute_command, 0, wpassword.value);
        }
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["auto-login.quit"] = function () {
        socket = null;
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["auto-login.username"] = function (data) {
        if (auto_login.checked && username.value) {
            setTimeout(execute_command, 0, username.value);
        }

        timer.postMessage(parseInt(data, 10));
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["channel.begin"] = function (data) {
        if (msg_window) {
            msg_data = JSON.parse(data);
        }
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["channel.end"] = function () {
        if (msg_window) {
            msg_data = {};
        }
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["char.id"] = set_char_id;

    //-------------------------------------------------------------------------

    gmcp_handlers["char.vitals"] = function (data) {
        vitals = data;

        if (hp.disabled) {
            backup_setting.disabled = false;
            channel.disabled = false;
            hp.disabled = false;
            map.disabled = false;
            restore_setting.disabled = false;

            if (config.display_map) {
                toggle_map();
            }

            if (config.display_monitor) {
                toggle_monitor();
            }
        } else if (config.display_monitor) {
            setTimeout(window.update_vitals, 0, vitals);
        }
    };

    //-----------------------------------------------------------------------

    gmcp_handlers["map.data"] = function (data) {
        vitals = data;

        write_text(data);
        setTimeout(draw_map, 0, data);
    };

    //-------------------------------------------------------------------------

    gmcp_handlers.cooldown = function (data) {
        timer.postMessage(JSON.parse(data));
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["driver.time"] = function (data) {
        timer.postMessage(data);
    };

    //-------------------------------------------------------------------------

    gmcp_handlers.error = set_response_time;

    //-------------------------------------------------------------------------

    gmcp_handlers["map.data"] = function (data) {
        data = JSON.parse(data);
        maps[data.name] = data;

        setTimeout(draw_map, 0, data);
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["map.sync"] = function (data) {
        data = JSON.parse(data);

        if (current.map && current.map.id === "m-" + data.name) {
            Array.prototype.forEach.call(current.map.getElementsByClassName("B5"), clean_cell);

            Object.keys(data.players).forEach(function (code) {
                set_cell(document.getElementById("m-" + data.name + "-" + code), data.players[code]);
            });
        }
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["map.update"] = function (data) {
        data = JSON.parse(data);

        if (current.map && current.map.id === "m-" + data.name) {
            var cell = document.getElementById("m-" + data.name + "-" + data.code);

            if (data.players.length) {
                data.players = data.players.filter(filter_char_id);
            }

            if (data.players.length) {
                set_cell(cell, data.players);
            } else {
                clean_cell(cell);
            }
        }
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["room.location"] = function (data) {
        var source;

        current.location = data = JSON.parse(data);
        source = maps[data.map];

        if (!source || source.timestamp !== data.timestamp) {
            if (data.map !== "unknown") {
                send_gmcp("load_map " + data.map);
            }
            return;
        }

        if (config.display_map) {
            setTimeout(move_map, 0);
        }
    };


    //-------------------------------------------------------------------------

    gmcp_handlers["settings.download"] = function (data) {
        data = JSON.parse(data);

        if (typeof data === "object") {
            load_custom_macro(data.macros);
            load_configuration(data.settings);

            data = "success";
        } else {
            data = data ? "not-found" : "failed";
        }

        set_text_content(restore_setting, data);

        setTimeout(restore_button_text, 3000, restore_setting);
    };

    //-------------------------------------------------------------------------

    gmcp_handlers["settings.upload"] = function (data) {
        set_text_content(backup_setting, data);

        setTimeout(restore_button_text, 3000, backup_setting);
    };

    //-------------------------------------------------------------------------

    (function () {

        var element, index, list, row;

        list = document.getElementById("macro_list");

        for (index = 0; index < 90; ++index) {
            row = document.createElement("DIV");

            element = SPAN.cloneNode(false);
            element.className = "num";
            element.textContent = index + 1;

            row.appendChild(element);

            element = document.createElement("INPUT");
            element.className = "key B7 H0";
            element.onchange = on_macro_key_change;
            element.onkeydown = on_macro_key_down;
            element.tabIndex = -1;
            element.type = "text";

            keys.push(element);

            row.appendChild(element);

            element = document.createElement("INPUT");
            element.className = "command B7 N0";
            element.onchange = on_macro_command_change;
            element.tabIndex = -1;
            element.type = "text";

            commands.push(element);

            row.appendChild(element);

            list.appendChild(row);
        }

        load_custom_macro(null);

    }());

    //-------------------------------------------------------------------------

    set_right(macro_table, location.macro[0]);
    set_top(macro_table, location.macro[1]);

    set_bottom(map_table, location.map[0]);
    set_left(map_table, location.map[1]);

    set_bottom(monitor, location.monitor[0]);
    set_right(monitor, location.monitor[1]);

    set_left(setting_table, location.setting[0]);
    set_top(setting_table, location.setting[1]);

    //------------------------------------------------------------------- Event

    backup_setting.onclick = function (event) {
        var element = event.target;

        if (!element.value && char_id) {
            element.value = element.textContent;
            set_text_content(element, "processing");
            setTimeout(execute_command, 0, "save_settings " + JSON.stringify({
                "macros": save_custom_macro(),
                "settings": save_configuration()
            }));
            // send_gmcp("save_settings " + JSON.stringify({
            //     "macros": save_custom_macro(),
            //     "settings": save_configuration()
            // }));
        }
    };

    channel.onclick = function () {
        if (msg_window) {
            msg_window = null;
            classes.remove("display_channel");
        } else {
            msg_window = window.open("", "msg-" + char_id);
            classes.add("display_channel");

            if (msg_window.location.href === "about:blank") {
                msg_window.location.href = "/web/message.html";
            }
        }
    };

    connect.onclick = function () {
        var host = window.location.host,
            protocol = window.location.protocol.replace("http", "ws");

        if (!socket) {
            connect.className = "pressing";
            notice.classList.add("invisible");

            socket = new WebSocket(protocol + "//" + host, "ascii");

            socket.binaryType = "arraybuffer";
            socket.onclose = disconnect;
            socket.onmessage = process_stream;
            socket.onopen = connecting;
        }

        return false;
    };

    content.addEventListener("wheel", function (event) {
        var delta = event.deltaY;

        event.preventDefault();

        switch (event.deltaMode) {
            case 1:
                delta *= 20;
                break;
            case 2:
                delta *= 480;
                break;
        }

        scroll_content(delta);
    });

    content.onclick = function (event) {
        var element = event.target;

        if (element.target) {
            if (!element.href) {
                execute_command(element.target);
            }
        } else {
            event.stopPropagation();
        }
    };

    document.body.onkeydown = function (event) {
        var element, value;

        element = event.target;

        if (element !== input && element !== event.currentTarget) {
            return;
        }

        value = get_key_value(event);

        if (value) {
            return execute_macro(value);
        }

        if (element === input) {
            if (event.which === 9) {
                if (input.value) {
                    auto_complete();
                }
                return false;
            }
        } else {
            if (event.which === 13) {
                input.focus();
            }
        }
    };

    document.getElementById("close_macro").onclick = toggle_macro;

    document.getElementById("close_setting").onclick = toggle_setting;

    document.getElementById("form").onsubmit = function () {
        var command;

        if (connector) {
            command = input.value;

            execute_command(command);

            if (clean_command.checked) {
                input.value = "";
                position = 0;
            } else {
                input.select();
                position = 1;
            }

            pending = "";

            if (echo && command && command !== history[history.length - 1]) {
                if (history.length === 100) {
                    history.shift();
                }

                history.push(command);
            }
        } else {
            connect.click();
        }

        return false;
    };

    document.getElementById("lock").onclick = toggle_frozen;

    document.getElementById("macro").onclick = toggle_macro;

    document.getElementById("macro_table").onmousedown = function (event) {
        var view = event.currentTarget;

        view.style.zIndex = ++z_index;

        if (event.which === 1 && event.target.id === "macro_header") {
            target = view.style;

            max_top = window.innerHeight - (min_bottom + view.offsetHeight);
            max_right = window.innerWidth - (min_left + view.offsetWidth);

            top = parseInt(target.top, 10) - event.clientY;
            right = parseInt(target.right, 10) + event.clientX;

            return false;
        }
    };

    document.getElementById("map_table").onmousedown = function (event) {
        var view = event.currentTarget;

        view.style.zIndex = ++z_index;

        if (event.which === 1 && event.target.id === "map_header") {
            target = view.style;

            max_bottom = window.innerHeight - (min_top + view.offsetHeight);
            max_left = window.innerWidth - (min_right + view.offsetWidth);

            bottom = parseInt(target.bottom, 10) + event.clientY;
            left = parseInt(target.left, 10) - event.clientX;

            return false;
        }
    };

    document.getElementById("monitor").ondblclick = toggle_monitor;

    document.getElementById("monitor").onmousedown = function (event) {
        var view = event.currentTarget;

        view.style.zIndex = ++z_index;

        if (event.which === 1) {
            target = view.style;

            max_bottom = window.innerHeight - (min_top + view.offsetHeight);
            max_right = window.innerWidth - (min_left + view.offsetWidth);

            bottom = parseInt(target.bottom, 10) + event.clientY;
            right = parseInt(target.right, 10) + event.clientX;

            return false;
        }
    };

    document.getElementById("setting").onclick = toggle_setting;

    document.getElementById("setting_table").onmousedown = function (event) {
        var view = event.currentTarget;

        view.style.zIndex = ++z_index;

        if (event.which === 1 && event.target.id === "setting_header") {
            target = view.style;

            max_top = window.innerHeight - (min_bottom + view.offsetHeight);
            max_left = window.innerWidth - (min_right + view.offsetWidth);

            top = parseInt(target.top, 10) - event.clientY;
            left = parseInt(target.left, 10) - event.clientX;

            return false;
        }
    };

    font.oninput = function () {
        main.style.fontFamily = "en, sym, \"" + font.value + "\", zh";

        if (msg_window) {
            msg_window.change_font_family();
        }
    };

    hp.onclick = toggle_monitor;

    input.onpaste = function (event) {
        var text;

        text = event.clipboardData || window.clipboardData;
        text = text.getData("text");
        text = input.value + text.replace(/\r\n/g, "\n");
        text = text.split("\n");

        input.value = text.pop();

        text.forEach(execute_command);

        return false;
    };

    map.onclick = toggle_map;

    restore_setting.onclick = function (event) {
        var element = event.target;

        if (!element.value && char_id) {
            element.value = element.textContent;
            set_text_content(element, "processing");
            setTimeout(execute_command, 0, "load_settings");
            send_gmcp("load_settings");
        }
    };

    translucent.onchange = function () {
        var func = translucent.checked ? classes.add : classes.remove;

        func.call(classes, "translucent");
    };

    uptime.onclick = function () {
        config.count_down = !config.count_down;
        uptime.className = config.count_down ? "H1" : "H7";

        timer.postMessage(config.count_down);
    };

    window.get_char_id = function () {
        return char_id;
    };

    window.get_color_class = function () {
        return document.documentElement.className;
    };

    window.get_font_family = function () {
        return font.value;
    };

    window.onbeforeunload = function () {
        save_configuration();

        location.macro[0] = parseInt(macro_table.right, 10);
        location.macro[1] = parseInt(macro_table.top, 10);

        location.map[0] = parseInt(map_table.bottom, 10);
        location.map[1] = parseInt(map_table.left, 10);

        location.monitor[0] = parseInt(monitor.bottom, 10);
        location.monitor[1] = parseInt(monitor.right, 10);

        location.setting[0] = parseInt(setting_table.left, 10);
        location.setting[1] = parseInt(setting_table.top, 10);

        localStorage.LOCATIONS = JSON.stringify(location);
        localStorage.WPASSWORD = wpassword.value;
        localStorage.PASSWORD = password.value;
        localStorage.USERNAME = username.value;

        if (connector) {
            return "";
        }
    };

    window.onclick = function (event) {
        var element = event.target;

        if (element.type === "wpassword" || element.type === "password" || element.type === "text") {
            return;
        }

        if (document.activeElement !== input) {
            setTimeout(function () {
                input.focus();
            }, 0);
        }
    };

    window.onmousemove = function (event) {
        if (target) {
            if (target.top) {
                set_top(target, top + event.clientY);
            } else {
                set_bottom(target, bottom - event.clientY);
            }

            if (target.left) {
                set_left(target, left + event.clientX);
            } else {
                set_right(target, right - event.clientX);
            }
        }
    };

    window.onmouseup = function () {
        if (target) {
            target = null;
        }
    };

    window.onunload = function () {
        if (socket) {
            socket.close();
        }
    };

    window.unload_msg_window = function () {
        if (msg_window) {
            channel.click();
        }
    };

    //-------------------------------------------------------------------------

    if (document.documentElement.ontouchstart !== undefined) {
        mobile = true;

        input.focus = function () {
            return;
        };
    }

    input.focus();
    load_configuration(null);

    //-------------------------------------------------------------------------

}(document, window));
