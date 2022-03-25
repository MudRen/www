/*jslint browser:true*/

window.update_vitals = (function (document) {

    'use strict';

    var atman, atman_factor, atman_p, atman_w, current, eff_gin, eff_kee,
        eff_sen, exp, food, food_p, food_w, force, force_factor, force_p,
        force_w, gin, gin_p1, gin_p2, gin_w1, gin_w2, kee, kee_p1, kee_p2,
        kee_w1, kee_w2, mana, mana_factor, mana_p, mana_w, max_atman, max_food,
        max_force, max_gin, max_kee, max_mana, max_sen, max_water, pot, sen,
        sen_p1, sen_p2, sen_w1, sen_w2, status, water, water_p, water_w;

    //-------------------------------------------------------------------------

    current = {};

    gin = document.getElementById('gin').firstChild;
    eff_gin = document.getElementById('eff_gin').firstChild;
    max_gin = document.getElementById('max_gin').firstChild;

    kee = document.getElementById('kee').firstChild;
    eff_kee = document.getElementById('eff_kee').firstChild;
    max_kee = document.getElementById('max_kee').firstChild;

    sen = document.getElementById('sen').firstChild;
    eff_sen = document.getElementById('eff_sen').firstChild;
    max_sen = document.getElementById('max_sen').firstChild;

    atman = document.getElementById('atman').firstChild;
    max_atman = document.getElementById('max_atman').firstChild;
    atman_factor = document.getElementById('atman_factor').firstChild;

    force = document.getElementById('force').firstChild;
    max_force = document.getElementById('max_force').firstChild;
    force_factor = document.getElementById('force_factor').firstChild;

    mana = document.getElementById('mana').firstChild;
    max_mana = document.getElementById('max_mana').firstChild;
    mana_factor = document.getElementById('mana_factor').firstChild;

    food = document.getElementById('food').firstChild;
    max_food = document.getElementById('max_food').firstChild;
    water = document.getElementById('water').firstChild;
    max_water = document.getElementById('max_water').firstChild;

    pot = document.getElementById('pot').firstChild;
    exp = document.getElementById('exp').firstChild;
    status = document.getElementById('status').firstChild;

    gin_w1 = document.getElementById('gin_w1');
    gin_w2 = document.getElementById('gin_w2');
    kee_w1 = document.getElementById('kee_w1');
    kee_w2 = document.getElementById('kee_w2');
    sen_w1 = document.getElementById('sen_w1');
    sen_w2 = document.getElementById('sen_w2');

    atman_w = document.getElementById('atman_w');
    force_w = document.getElementById('force_w');
    mana_w = document.getElementById('mana_w');

    food_w = document.getElementById('food_w');
    water_w = document.getElementById('water_w');

    //-------------------------------------------------------------------------

    function get_percent(value, max) {
        if (value < 0 || max < 0) {
            return 0;
        }

        if (!value) {
            return max ? 0 : 100;
        }

        return Math.floor(value * 100 / max);
    }

    //-------------------------------------------------------------------------

    function set_color(node, percent) {
        var color;

        if (percent > 100) {
            color = 'H6';
        } else if (percent >= 90) {
            color = 'H2';
        } else if (percent >= 60) {
            color = 'H3';
        } else if (percent >= 30) {
            color = 'N3';
        } else if (percent >= 10) {
            color = 'H1';
        } else {
            color = 'N1';
        }

        if (node.className !== color) {
            node.className = color;
        }
    }

    //-------------------------------------------------------------------------

    return function (data) {
        var w1, w2;

        data = JSON.parse(data);

        // console.log(data);

        w1 = w2 = null;

        if (current.gin !== data.gin) {
            gin.nodeValue = w1 = data.gin;
        }

        if (current.eff_gin !== data.eff_gin) {
            eff_gin.nodeValue = w1 = w2 = data.eff_gin;
        }

        if (current.max_gin !== data.max_gin) {
            w2 = true;
        }

        if (w1 !== null) {
            w1 = get_percent(data.gin, data.eff_gin);

            if (gin_p1 !== w1) {
                gin_p1 = w1;

                set_color(gin_w1, gin_p1);
            }
        }

        if (w2 !== null) {
            w2 = get_percent(data.eff_gin, data.max_gin);

            if (gin_p2 !== w2) {
                max_gin.nodeValue = gin_p2 = w2;

                set_color(gin_w2, gin_p2);
            }
        }

        //--

        w1 = w2 = null;

        if (current.kee !== data.kee) {
            kee.nodeValue = w1 = data.kee;
        }

        if (current.eff_kee !== data.eff_kee) {
            eff_kee.nodeValue = w1 = w2 = data.eff_kee;
        }

        if (current.max_kee !== data.max_kee) {
            w2 = true;
        }

        if (w1 !== null) {
            w1 = get_percent(data.kee, data.eff_kee);

            if (kee_p1 !== w1) {
                kee_p1 = w1;

                set_color(kee_w1, kee_p1);
            }
        }

        if (w2 !== null) {
            w2 = get_percent(data.eff_kee, data.max_kee);

            if (kee_p2 !== w2) {
                max_kee.nodeValue = kee_p2 = w2;

                set_color(kee_w2, kee_p2);
            }
        }

        //--

        w1 = w2 = null;

        if (current.sen !== data.sen) {
            sen.nodeValue = w1 = data.sen;
        }

        if (current.eff_sen !== data.eff_sen) {
            eff_sen.nodeValue = w1 = w2 = data.eff_sen;
        }

        if (current.max_sen !== data.max_sen) {
            w2 = true;
        }

        if (w1 !== null) {
            w1 = get_percent(data.sen, data.eff_sen);

            if (sen_p1 !== w1) {
                sen_p1 = w1;

                set_color(sen_w1, sen_p1);
            }
        }

        if (w2 !== null) {
            w2 = get_percent(data.eff_sen, data.max_sen);

            if (sen_p2 !== w2) {
                max_sen.nodeValue = sen_p2 = w2;

                set_color(sen_w2, sen_p2);
            }
        }

        //--

        w1 = null;

        if (current.atman !== data.atman) {
            atman.nodeValue = w1 = data.atman;
        }

        if (current.max_atman !== data.max_atman) {
            max_atman.nodeValue = w1 = data.max_atman;
        }

        if (current.atman_factor !== data.atman_factor) {
            atman_factor.nodeValue = data.atman_factor;
        }

        if (w1 !== null) {
            w1 = get_percent(data.atman, data.max_atman);

            if (atman_p !== w1) {
                atman_p = w1;

                set_color(atman_w, atman_p);
            }
        }

        //--

        w1 = null;

        if (current.force !== data.force) {
            force.nodeValue = w1 = data.force;
        }

        if (current.max_force !== data.max_force) {
            max_force.nodeValue = w1 = data.max_force;
        }

        if (current.force_factor !== data.force_factor) {
            force_factor.nodeValue = data.force_factor;
        }

        if (w1 !== null) {
            w1 = get_percent(data.force, data.max_force);

            if (force_p !== w1) {
                force_p = w1;

                set_color(force_w, force_p);
            }
        }

        //--

        w1 = null;

        if (current.mana !== data.mana) {
            mana.nodeValue = w1 = data.mana;
        }

        if (current.max_mana !== data.max_mana) {
            max_mana.nodeValue = w1 = data.max_mana;
        }

        if (current.mana_factor !== data.mana_factor) {
            mana_factor.nodeValue = data.mana_factor;
        }

        if (w1 !== null) {
            w1 = get_percent(data.mana, data.max_mana);

            if (mana_p !== w1) {
                mana_p = w1;

                set_color(mana_w, mana_p);
            }
        }

        //--

        w1 = null;

        if (current.food !== data.food) {
            food.nodeValue = w1 = data.food;
        }

        if (current.max_food !== data.max_food) {
            max_food.nodeValue = w1 = data.max_food;
        }

        if (w1 !== null) {
            w1 = get_percent(data.food, data.max_food);

            if (food_p !== w1) {
                food_p = w1;

                set_color(food_w, food_p);
            }
        }

        //--

        w1 = null;

        if (current.water !== data.water) {
            water.nodeValue = w1 = data.water;
        }

        if (current.max_water !== data.max_water) {
            max_water.nodeValue = w1 = data.max_water;
        }

        if (w1 !== null) {
            w1 = get_percent(data.water, data.max_water);

            if (water_p !== w1) {
                water_p = w1;

                set_color(water_w, water_p);
            }
        }

        //--

        if (current.pot !== data.pot) {
            pot.nodeValue = data.pot;
        }

        if (current.exp !== data.exp) {
            exp.nodeValue = data.exp;
        }

        // if (current.status !== data.status) {
        //     status.nodeValue = data.status;
        // }

        current = data;
    };

    //-------------------------------------------------------------------------

}(document));
