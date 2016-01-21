var gxp = 0;

var material_list = {};

$.expr[':'].icontains = $.expr.createPseudo(function (text) {
    return function (e) {
        return $(e).text().toUpperCase().indexOf(text.toUpperCase()) >= 0;
    };
});

function get_guild_lv() {
    return Math.floor(gxp / 100);
}

function save_to_localStorage() {
    // save upgrade list

    var upgrade_save_str = JSON.stringify(guild_db().select("Done", "Upgrade"));

    localStorage.setItem("upgrade_record", upgrade_save_str);

    // save material list
    var material_save_list = {};

    $(".material_row").each(function () {
        var item_id = $(this).data("item-id");
        var had = $(this).find(".had").val();

        material_save_list[item_id] = had;
    });
    var material_save_str = JSON.stringify(material_save_list);

    localStorage.setItem("material_record", material_save_str);
}

function load_from_localStorage() {
    // load upgrade list

    var upgrade_record_array = JSON.parse(localStorage.getItem("upgrade_record"));

    $.each(upgrade_record_array, function (index, value) {
        var done = value[0];
        var upgrade_name = value[1];

        if (done == 1) {
            upgrade_done(upgrade_name, 1);
        }
    });

    // load material list
    var material_record_list = JSON.parse(localStorage.getItem("material_record"));

    $.each(material_record_list, function (index, value) {
        var item_id = index;
        var had = value;

        $(".material_row[data-item-id='" + item_id.toString() + "']").find(".had").val(had.toString());
    });

    material_had_change();
}

function update_gxp_bar() {
    var precentage = gxp % 100;
    var next_gxp = gxp - precentage + 100;
    var guild_lv = get_guild_lv();
    $('#gxp_bar').css('width', precentage + '%').attr('aria-valuenow', precentage).text(gxp.toString() + " / " + next_gxp.toString());
    $('#guild_lv').text("Lv " + guild_lv.toString());
}

function update_upgrade_ready() {
    $(".material").each(function () {
        var ready = 0;
        // if done, then will be ready
        if ($(this).parent().find(".done > .glyphicon").hasClass("glyphicon-ok")) {
            ready = 2;
        } else {
            var upgrade_name = $(this).data("upgrade-name");

            var required_lv = guild_db({ Upgrade: upgrade_name }).first().LevelRequire;
            if (required_lv <= get_guild_lv()) {
                ready = 2;

                // check hierarchy first
                upgrade_hierarchy({ Upgrade: upgrade_name }).each(function (record, recordnumber) {
                    var need_upgrade = record["Need"];
                    if ($(".material[data-upgrade-name='" + need_upgrade + "']").parent().find(".done > .glyphicon").hasClass("glyphicon-remove")) {
                        ready = 0;
                    }
                });

                if (ready != 0) {
                    material_db({ Upgrade: upgrade_name }).each(function (record, recordnumber) {
                        if (get_material_had(record["ItemId"]) < record["ItemQuantity"]) {
                            ready = 1;
                        }
                    });
                }
            }
        }

        var glyphicon_elem = $(this).parent().find(".ready > .glyphicon");
        glyphicon_elem.removeClass();
        glyphicon_elem.addClass("glyphicon");
        if (ready == 0) {
            glyphicon_elem.addClass("glyphicon-remove");
        } else if (ready == 1) {
            glyphicon_elem.addClass("glyphicon-exclamation-sign");
        } else {
            glyphicon_elem.addClass("glyphicon-ok");
        }
    });
}

// mode: 0 => toggle
//       1 => done
//       -1 => undone
function upgrade_done(upgrade_name, mode) {
    var earned_gxp = guild_db({ Upgrade: upgrade_name }).first().Exp_earned;
    var icon_elem = $(".material[data-upgrade-name='" + upgrade_name + "']").parent().find(".done > .glyphicon");
    // var icon_elem = $(this).find(".glyphicon");
    if (icon_elem.hasClass("glyphicon-remove") && mode != -1) {
        // Gain GXP
        gxp += earned_gxp;
        // Change icon to done
        icon_elem.removeClass("glyphicon-remove");
        icon_elem.addClass("glyphicon-ok");
        // update TAFFYDB
        guild_db({ Upgrade: upgrade_name }).update({ Done: 1 });
    } else if (icon_elem.hasClass("glyphicon-ok") && mode != 1) {
        // Remove GXP
        gxp -= earned_gxp;
        // Change icon to done
        icon_elem.removeClass("glyphicon-ok");
        icon_elem.addClass("glyphicon-remove");
        // update TAFFYDB
        guild_db({ Upgrade: upgrade_name }).update({ Done: 0 });
    }

    update_gxp_bar();
    // Refresh Material List

    // Update Ready State
    update_upgrade_ready();
    update_upgrade_row_color();
    update_upgrade_material_opacity();

    update_material_need();
    update_material_row_color_and_left();

    upgrades_tablesort_update_no_sort();
}

function material_tablesort_update() {
    $("#material_list").trigger("update");
    var sorting = $("#material_list").get(0).config.sortList;
    $("#material_list").trigger("sorton", [sorting]);
}

function upgrades_tablesort_update_no_sort() {
    $("#upgrade_list").trigger("update");
}

function upgrade_done_click(event) {
    var upgrade_name = event.data.upgrade_name;
    upgrade_done(upgrade_name, 0);
}

// mode: 0 => toggle
//       1 => done
//       -1 => undone
function upgrade_want(upgrade_name, mode) {
    var icon_elem = $(".material[data-upgrade-name='" + upgrade_name + "']").parent().find(".want > .glyphicon");
    if (icon_elem.hasClass("glyphicon-remove") && mode != -1) {
        // Change icon to done
        icon_elem.removeClass("glyphicon-remove");
        icon_elem.addClass("glyphicon-ok");
        // update TAFFYDB
        guild_db({ Upgrade: upgrade_name }).update({ Want: 1 });
    } else if (icon_elem.hasClass("glyphicon-ok") && mode != 1) {
        // Change icon to done
        icon_elem.removeClass("glyphicon-ok");
        icon_elem.addClass("glyphicon-remove");
        // update TAFFYDB
        guild_db({ Upgrade: upgrade_name }).update({ Want: 0 });
    }

    update_material_need();

    upgrades_tablesort_update_no_sort();
}

function upgrade_want_click(event) {
    var upgrade_name = event.data.upgrade_name;
    upgrade_want(upgrade_name, 0);
}

function update_upgrade_row_color() {
    $("#upgrade_list > tbody > tr").each(function () {
        var ready_icon_elem = $(this).find(".ready > .glyphicon");
        var done_icon_elem = $(this).find(".done > .glyphicon");

        $(this).removeClass();
        // check done
        if (done_icon_elem.hasClass("glyphicon-ok")) {
            $(this).addClass("success");
        } else {
            // check ready
            if (ready_icon_elem.hasClass("glyphicon-ok")) {
                $(this).addClass("info");
            } else if (ready_icon_elem.hasClass("glyphicon-exclamation-sign")) {
                $(this).addClass("warning");
            }
        }
    });
}

function initial_upgrade_list() {
    // Insert Structure Options
    $.each(guild_db().distinct("Structure"), function(index, value) {
        $("#upgrade_structure_opt").append("<button type='button' class='btn btn-primary structure_option'>" + value + "</button>");
    });

    var header = $("#upgrade_list > thead > tr");
    // Insert header bars
    var header_titles = ["Structure", "Upgrade", "Guild Lv", "Want", "Done", "Ready", "GXP", "Aetherium", "Valor", "Gold", "Materials"];
    for (var i in header_titles) {
        header.append("<th>" + header_titles[i] + "</th>");
    }
    $("#upgrade_list > thead > tr > th:last").attr("width", "25%");

    // Insert Upgrade List
    var tbody = $("#upgrade_list > tbody");
    var guild_lv = get_guild_lv();
    guild_db().each(function (record, recordnumber) {

        var done = false;
        var ready = false;

        /*
        if (record["Done"] == 1) {
            done = true;
        }
        var ready = (record["LevelRequire"] <= guild_lv);
        */

        html_str = "<tr";
        if (ready && !done) {
            html_str += " class='info'";
        } else if (done) {
            html_str += " class='success'";
        }
        html_str += ">";
        html_str += "<td class='vert-align'>" + record["Structure"] + "</td>";
        html_str += "<td class='vert-align upgrade_name'>" + record["Upgrade"] + "</td>";
        html_str += "<td class='vert-align'>" + record["LevelRequire"] + "</td>";
        html_str += "<td class='want vert-align'><span class='glyphicon glyphicon-ok' aria-hidden='true'></span></td>";
        if (done) {
            html_str += "<td class='done vert-align'><span class='glyphicon glyphicon-ok' aria-hidden='true'></span></td>";
        } else {
            html_str += "<td class='done vert-align'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></td>";
        }
        if (ready) {
            html_str += "<td class='ready vert-align'><span class='glyphicon glyphicon-ok' aria-hidden='true'></span></td>";
        } else {
            html_str += "<td class='ready vert-align'><span class='glyphicon glyphicon-remove' aria-hidden='true'></span></td>";
        }
        html_str += "<td class='vert-align'>" + record["Exp_earned"] + "</td>";
        html_str += "<td class='vert-align'>" + record["Aetherium"] + "</td>";
        html_str += "<td class='vert-align'>" + record["Valor"] + "</td>";
        html_str += "<td class='vert-align'>" + record["Gold"] / 10000 + "</td>";
        html_str += "<td class='material' data-upgrade-name='" + record["Upgrade"] + "'></td>";
        html_str += "</tr>";

        // tbody.append(html_str);
        var new_row = $(html_str).appendTo(tbody);
        new_row.find(".done").click({ upgrade_name: record["Upgrade"] }, upgrade_done_click);
        new_row.find(".want").click({ upgrade_name: record["Upgrade"] }, upgrade_want_click);
    });

    // materials

    var total_materials = [];
    $(".material").each(function () {
        var upgrade = $(this).data("upgrade-name");
        var td_elem = $(this);
        material_db({ Upgrade: upgrade }).order("ItemId").each(function (record, recordnumber) {
            var item_id = record["ItemId"];
            total_materials.push(item_id);

            // insert DOM first, only update src after JSON response
            var item_name = record["ItemName"];
            var wrapper = $("<span class='img_wrapper upgrade_material' data-html='true' data-toggle='tooltip' data-item-id='" + item_id + "'></span>").appendTo(td_elem);
            wrapper.attr("title", item_name);

            var img = new Image();
            img.setAttribute("height", "40");
            img.setAttribute("width", "40");
            img.setAttribute("data-item-id", item_id.toString());
            img.setAttribute("class", "upgrade_material_img");


            wrapper.append(img);
            wrapper.append("<p class='material_img_num'>" + record["ItemQuantity"] + "</p>")
            wrapper.tooltip();
        });
    });

    // update all img srcs
	if (total_materials.length != 0) {
		var unique_materials = total_materials.filter(only_unique);
		var current_index = 0;
		var materials_length = unique_materials.length;
		var chunk_size = 300;
		for (; current_index < materials_length; current_index += chunk_size) {
			var temp_list = unique_materials.slice(current_index, current_index + chunk_size);
			var ids = temp_list.join();
			$.getJSON("https://api.guildwars2.com/v2/items?lang=en&ids=" + ids, function (data) {
				for (var index in data) {
					var item = data[index];
					var item_id = item.id;
					var img_src = item.icon;

					$(".upgrade_material_img[data-item-id='" + item_id.toString() + "']").attr("src", img_src);
				}
			});
		}
	}
}

function only_unique(value, index, self) { 
    return self.indexOf(value) === index;
}

function update_upgrade_material_opacity() {
    $(".upgrade_material").each(function () {
        var item_id = parseInt($(this).data("item-id"));
        var material_had = get_material_had(item_id);
        var material_need = parseInt($(this).find(".material_img_num").text());
        var img_elem = $(this).find("img");
        if ($(this).parent().parent().find(".done > .glyphicon").hasClass("glyphicon-ok")) {
            if (img_elem.hasClass("upgrade_material_not_enough")) {
                img_elem.removeClass("upgrade_material_not_enough");
            }
        } else if (material_had >= material_need && img_elem.hasClass("upgrade_material_not_enough")) {
            img_elem.removeClass("upgrade_material_not_enough");
        } else if (material_had < material_need && img_elem.hasClass("upgrade_material_not_enough") == false) {
            img_elem.addClass("upgrade_material_not_enough");
        }
    });
}

function SortByName(a, b) {
    var aName = a[1].toLowerCase();
    var bName = b[1].toLowerCase();
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

function initial_material_list() {
    var header = $("#material_list > thead > tr");
    // Insert header bars
    var header_titles = ["Material", "Price", "Needed", "Had", "Left"];
    for (var i in header_titles) {
        header.append("<th>" + header_titles[i] + "</th>");
    }

    // Insert all materials
    var material_array = material_db().distinct("ItemId", "ItemName").sort(SortByName);
    // get all material ids
    var ids = "";
    $.each(material_array, function (index, value) {
        // insert all rows first
        // (IF you insert rows in JSON response, it will cause bug at update_material_needed function)
        ids += value[0].toString() + ",";

        var tr_elem = $("<tr class='material_row' data-item-id='" + value[0].toString() + "'></tr>").appendTo($("#material_list > tbody"));
        tr_elem.append("<td class='material_name'></td><td class='material_price vert-align'></td><td class='needed vert-align'>0</td><td class='vert-align'><input type='number' min='0' value='0' class='had' /></td><td class='left vert-align'></td>");
        var img = new Image();
        img.setAttribute("height", "40");
        img.setAttribute("width", "40");
        var item_name = value[1];
        var url = encodeURI("http://wiki.guildwars2.com/wiki/" + item_name)
        tr_elem.find(".material_name").append(img).append("<a href='" + url + "' target='_blank'>" + item_name + "</a>");
    });
    // get material data through JSON
    if (ids != "") {
        // get data
        $.getJSON("https://api.guildwars2.com/v2/items?lang=en&ids=" + ids, function (data) {
            for (var index in data) {
                var item = data[index];
                var img_src = item.icon;
                var item_id = item.id;
                var flags = item.flags;

                // insert into material lists
                var tr_elem = $("tr[data-item-id='" + item_id.toString() + "']");
                tr_elem.find(".material_name > img").attr("src", img_src);

                // check account bound
                if (flags.indexOf("AccountBound") != -1) {
                    tr_elem.find(".material_price").text("Account Bound");
                }
            }
            $("#material_list").trigger("update");
        });

        // get price
        $.getJSON("https://api.guildwars2.com/v2/commerce/prices?ids=" + ids, function (data) {
            for (var index in data) {
                var item = data[index];
                var item_id = item.id;
                var sell_price = item.sells.unit_price;
                var buy_price = item.buys.unit_price;

                // insert into material lists
                var tr_elem = $("tr[data-item-id='" + item_id.toString() + "']");
                var gold = Math.floor(sell_price / 10000);
                var silver = Math.floor(sell_price / 100) % 100;
                var copper = sell_price % 100;
                tr_elem.find(".material_price").append(gold.toString() + "&nbsp;<img src='./Content/Gold_coin.png' alt='Gold' />&nbsp;" + silver.toString() + "&nbsp;<img src='./Content/Silver_coin.png' alt='Gold' />&nbsp;" + copper.toString() + "&nbsp;<img src='./Content/Copper_coin.png' alt='Gold' />");
                tr_elem.find(".material_price").data("price", sell_price.toString());
            }
            $("#material_list").trigger("update");
        });
    }

    // append on change event to had class
    $(".had").change(material_had_change);
}

// 0 = undone, 1 = ready, 2 = want
var material_show_setting = 0;

function update_material_need() {
    // clear all needed to 0
    $(".needed").text("0");

    var material_needed = {};

    if (material_show_setting == 0) {
        // search for every undone upgrades
        $("#upgrade_list > tbody > tr").each(function () {
            var upgrade_name = $(this).find(".upgrade_name").text();
            if (!$(this).find(".done > .glyphicon").hasClass("glyphicon-ok")) {
                material_db({ Upgrade: upgrade_name }).each(function (record, recordnumber) {
                    var item_id = record["ItemId"];
                    var item_quantity = record["ItemQuantity"];

                    if (!(item_id in material_needed)) {
                        material_needed[item_id] = 0;
                    }
                    material_needed[item_id] += item_quantity;
                });
            }
        });
    } else if (material_show_setting == 1) {
        // search for every ready but undone upgrades
        $("#upgrade_list > tbody > tr").each(function () {
            var ready = !$(this).find(".ready > .glyphicon").hasClass("glyphicon-remove");
            var undone = $(this).find(".done > .glyphicon").hasClass("glyphicon-remove");

            if (ready && undone) {
                var upgrade_name = $(this).find(".upgrade_name").text();
                material_db({ Upgrade: upgrade_name }).each(function (record, recordnumber) {
                    var item_id = record["ItemId"];
                    var item_quantity = record["ItemQuantity"];

                    if (!(item_id in material_needed)) {
                        material_needed[item_id] = 0;
                    }
                    material_needed[item_id] += item_quantity;
                });
            }
        });
    } else if (material_show_setting == 2) {
        // search for every want but undone upgrades
        $("#upgrade_list > tbody > tr").each(function () {
            var want = $(this).find(".want > .glyphicon").hasClass("glyphicon-ok");
            var undone = $(this).find(".done > .glyphicon").hasClass("glyphicon-remove");

            if (want && undone) {
                var upgrade_name = $(this).find(".upgrade_name").text();
                material_db({ Upgrade: upgrade_name }).each(function (record, recordnumber) {
                    var item_id = record["ItemId"];
                    var item_quantity = record["ItemQuantity"];

                    if (!(item_id in material_needed)) {
                        material_needed[item_id] = 0;
                    }
                    material_needed[item_id] += item_quantity;
                });
            }
        });
    }

    // update item_quantity to needed
    $.each(material_needed, function (item_id, item_quantity) {
        $("tr[data-item-id='" + item_id.toString() + "'] > .needed").text(item_quantity.toString());
    });

    // hide those needed is 0

    $(".needed").parent().show();
    $(".needed").filter(function () {
        return $(this).text() == "0";
    }).parent().hide();

    // hide those not fit the search text
    var search_text = $(".material_search").val().trim();
    if (search_text != "") {
        var search_text_array = search_text.toLowerCase().match(/\S+/g);
        $(".material_name").each(function () {
            var material_name_elem = $(this);
            $.each(search_text_array, function (index, value) {
                if (material_name_elem.text().toLowerCase().indexOf(value) < 0) {
                    material_name_elem.parent().hide();
                    return false;
                }
            });
        });
        // $(".material_name:not(:icontains(" + search_text + "))").parent().hide();
    }
}

function get_material_had(item_id) {
    return parseInt($("#material_list > tbody > tr[data-item-id='" + item_id.toString() + "']").find(".had").val()) || 0;
}

function update_material_row_color_and_left() {
    $("#material_list > tbody > tr").each(function () {
        $(this).removeClass("info");
        $(this).removeClass("success");
        var needed = parseInt($(this).find(".needed").text());
        var had = parseInt($(this).find(".had").val());

        if (needed > 0) {
            if (needed > had) {
                $(this).addClass("info");
            } else {
                $(this).addClass("success");
            }
        }
		
		$(this).find(".left").text((needed - had).toString());
    });
}

function material_had_change() {
    update_material_row_color_and_left();
    update_upgrade_material_opacity();
    update_upgrade_ready();
    update_upgrade_row_color();
}

function material_option_btn_click() {
    // skip if it is active
    if ($(this).hasClass("btn-primary")) {
        return;
    }

    // change the classes of the option btns
    $(".material_option.btn-primary").removeClass("btn-primary").addClass("btn-default");
    $(this).removeClass("btn-default").addClass("btn-primary");

    if ($(this).text() == "Undone") {
        material_show_setting = 0;
    } else if ($(this).text() == "Ready") {
        material_show_setting = 1;
    } else if ($(this).text() == "Want") {
        material_show_setting = 2;
    }

    update_material_need();
    update_material_row_color_and_left();
}

// mode = -1 : hide
//        0 : toggle
//        1 : show
function toggle_upgrade_row_by_structure(structure_name, mode) {

    var row_elems = $("#upgrade_list > tbody > tr > td:first-child").filter(function () {
        return $(this).text() == structure_name;
    }).parent();

    if (mode == 1) {
        row_elems.show();
    } else if (mode == -1) {
        row_elems.hide();
    } else {
        row_elems.toggle();
    }
}

function structure_option_btn_click() {
    // toggle the class
    $(this).toggleClass("btn-default").toggleClass("btn-primary");
    toggle_upgrade_row_by_structure($(this).text(), 0)
}

function material_search_input() {
    update_material_need();
}

var php_url = "http://gw2-ghuc.rhcloud.com/";

function register_btn_pressed() {
    $("#signup_status").text("");

    var username = $("#signup_username").val();
    var password = $("#signup_password").val();

    var post_data = {
        username: username,
        password: password
    };

    $("#signup_status").text("Please wait...");

    $.ajax({
        url: php_url + "signup.php",
        type: 'post',
        dataType: 'json',
        success: function (data) {
            var result = data.result;
            if (result == 0) {
                $("#signup_status").text("You've Successfully Signed up!");
                setTimeout(function () {
                    $("#signup_modal").modal("hide");
                }, 1000);
            } else if (result == 1) {
                $("#signup_status").text("This username is already used. Please try another one.");
            }
        },
        data: post_data
    });
}

function login_btn_pressed() {
    $("#login_status").text("");

    var username = $("#login_username").val();
    var password = $("#login_password").val();

    var post_data = {
        username: username,
        password: password
    };

    $("#login_status").text("Please wait...");

    $.ajax({
        url: php_url + "login.php",
        type: 'post',
        dataType: 'json',
        success: function (data) {
            var result = data.result;
            if (result == 0) {
                $("#login_status").text("You've Successfully Logged in!");

                Cookies.set('username', username);
                Cookies.set('password', password);

                setTimeout(function () {
                    $("#login_modal").modal("hide");
                    update_login_status();
                }, 1000);
            } else if (result == 1) {
                $("#login_status").text("Your username / password is incorrect. Please try again.");
            }
        },
        data: post_data
    });
}

function save_to_server() {
    // save upgrade list
    var upgrade_save_str = JSON.stringify(guild_db().select("Done", "Upgrade", "Want"));

    // save material list
    var material_save_list = {};

    $(".material_row").each(function () {
        var item_id = $(this).data("item-id");
        var had = $(this).find(".had").val();

        material_save_list[item_id] = had;
    });
    var material_save_str = JSON.stringify(material_save_list);

    // ajax
    var username = Cookies.get("username");
    var password = Cookies.get("password");

    var post_data = {
        username: username,
        password: password,
        upgrades: upgrade_save_str,
        materials: material_save_str
    };

    $.ajax({
        url: php_url + "save.php",
        type: 'post',
        dataType: 'json',
        success: function (data) {
            var result = data.result;
            if (result == 0) {
                $("#save_status").text("The data is successfully saved.");

                setTimeout(function () {
                    $("#save_modal").modal("hide");
                    $("#save_status").text("");
                }, 1000);
            } else if (result == 1) {
                $("#save_status").text("Save error. Please try again later.");

                setTimeout(function () {
                    $("#save_modal").modal("hide");
                    $("#save_status").text("");
                }, 1000);
            }
        },
        data: post_data
    });
}

function load_from_server_with_username(username) {
    var post_data = {
        username: username
    };

    $.ajax({
        url: php_url + "load.php",
        type: 'post',
        dataType: 'json',
        success: function (data) {
            var result = data.result;
            if (result == 0) {
                // load upgrade list

                var upgrade_record_array = JSON.parse(data.upgrades);

                $.each(upgrade_record_array, function (index, value) {
                    var done = value[0];
                    var upgrade_name = value[1];
                    var want = value[2];

                    if (done == 1) {
                        upgrade_done(upgrade_name, 1);
                    }

                    if (want == 0) {
                        upgrade_want(upgrade_name, -1);
                    }
                });

                // load material list
                var material_record_list = JSON.parse(data.materials);

                $.each(material_record_list, function (index, value) {
                    var item_id = index;
                    var had = value;

                    $(".material_row[data-item-id='" + item_id.toString() + "']").find(".had").val(had.toString());
                });

                material_had_change();

                $("#load_status").text("The data is successfully loaded.");

                setTimeout(function () {
                    $("#load_modal").modal("hide");
                    $("#load_status").text("");
                }, 1000);
            } else if (result == 1) {
                $("#load_status").text("Load error. Please try again later.");

                setTimeout(function () {
                    $("#load_modal").modal("hide");
                    $("#load_status").text("");
                }, 1000);
            }
        },
        data: post_data
    });
}

function load_from_server() {
    // ajax
    var username = Cookies.get("username");

    load_from_server_with_username(username);
}

function logout() {
    Cookies.remove("username");
    Cookies.remove("password");

    setTimeout(function () {
        $("#logout_modal").modal("hide");
        update_login_status();
    }, 1000);
}

function update_login_status() {
    if (Cookies.get("username") == undefined || Cookies.get("password") == undefined) {
        $("#nav_save").hide();
        $("#nav_load").hide();
        $("#nav_logout").hide();
        $("#nav_signup").show();
        $("#nav_signin").show();
    } else {
        $("#nav_save").show();
        $("#nav_load").show();
        $("#nav_logout").show();
        $("#nav_signup").hide();
        $("#nav_signin").hide();
    }
}

var QueryString = function () {
    // This function is anonymous, is executed immediately and 
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1]);
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return query_string;
}();


$(document).ready(function () {
    update_gxp_bar();
    initial_upgrade_list();
    initial_material_list();
    update_upgrade_ready();
    update_upgrade_row_color();
    update_upgrade_material_opacity();

    update_material_need();
    update_material_row_color_and_left();

    $(".structure_option").click(structure_option_btn_click);
    $(".material_option").click(material_option_btn_click);
    $(".material_search").on("input", material_search_input);

    $("#materials_t").on('show.bs.tab', material_tablesort_update);

    update_login_status();

    $('#login_modal').on('shown.bs.modal', function () {
        $('#login_username').focus()
    });
    $('#signup_modal').on('shown.bs.modal', function () {
        $('#signup_username').focus()
    });
    $("#save_modal").on("shown.bs.modal", save_to_server);
    $("#load_modal").on("shown.bs.modal", load_from_server);
    $("#logout_modal").on("shown.bs.modal", logout);

    // read url
    if (QueryString.username != undefined) {
        // logout if logged in
        Cookies.remove("username");
        Cookies.remove("password");
        update_login_status();
        // load
        Cookies.set("username", QueryString.username);
        $("#load_modal").modal("show");
    }

    // make the table sortable
    $("#upgrade_list").tablesorter({
        headers: {
            10: { sorter: false }
        },
        textExtraction: {
            3: tablesort_glyphicon_compare,
            4: tablesort_glyphicon_compare,
            5: tablesort_glyphicon_compare
        },
        sortList: [[2, 0]]
    });
    $("#material_list").tablesorter({
        headers: {
            1: { sorter: 'digit' },
            3: { sorter: false }
        },
        textExtraction: {
            0: function (node) {
                return $(node).text();
            },
            1: function (node) {
                if ($(node).text() == "Account Bound") {
                    return 999999999;
                } else {
                    return parseInt($(node).data("price"));
                }
            }
        },
        sortList: [[0, 0]]
    });

    var offset = $('.navbar').height();
    $('#upgrade_list').stickyTableHeaders({ fixedOffset: offset });
    $('#material_list').stickyTableHeaders({ fixedOffset: offset });
});

function tablesort_glyphicon_compare(node) {
    if ($(node).find(".glyphicon").hasClass("glyphicon-remove")) {
        return "0";
    } else if ($(node).find(".glyphicon").hasClass("glyphicon-exclamation-sign")) {
        return "1";
    } else {
        return "2";
    }
}