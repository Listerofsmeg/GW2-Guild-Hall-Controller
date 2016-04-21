/**
 * Created by Nier on 2016/1/9.
 */
// React Bootstrap variables
var Navbar = ReactBootstrap.Navbar;
var Nav = ReactBootstrap.Nav;
var NavItem = ReactBootstrap.NavItem;
var Tabs = ReactBootstrap.Tabs;
var Tab = ReactBootstrap.Tab;
var Glyphicon = ReactBootstrap.Glyphicon;
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var OverlayTrigger = ReactBootstrap.OverlayTrigger;
var Tooltip = ReactBootstrap.Tooltip;
var Modal = ReactBootstrap.Modal;
var Button = ReactBootstrap.Button;
var Input = ReactBootstrap.Input;
var ListGroup = ReactBootstrap.ListGroup;
var ListGroupItem = ReactBootstrap.ListGroupItem;
var Badge = ReactBootstrap.Badge;

var php_url = "http://gw2-ghuc.rhcloud.com/";

// Strings
var Strings = {
    WebsiteTitle: "Guild Hall Upgrade Controller",
    Register: "Register",
    Login: "Sign in",
    Save: "Save",
    Load: "Load",
    Logout: "Logout",
    LoadFromAPI: "API Load",
    Help: "Help",
    Close: "Close",
    LevelShort: "Lv",
    Upgrades: "Upgrades",
    Materials: "Materials",
    GuildHallUpgradeList: "Guild Hall Upgrade List",
    MaterialList: "Material List",
    Undone: "Undone",
    Ready: "Ready",
    Want: "Want",
    Search: "Search",
    SignUp: "Sign up",
    Username: "Username",
    Password: "Password",
    Cancel: "Cancel",
    UpgradeHeaders: ["Structure", "Upgrade", "Guild Lv", "Want", "Done", "Ready", "GXP", "Aetherium", "Valor", "Gold", "Materials"],
    MaterialHeaders: ["Material", "Price", "Needed", "Had", "Left"],
    AccountBound: "Account Bound"
};

var upgrade_sorterable = [true, true, true, true, true, true, true, true, true, true, false];

function getGuildLv(gxp) {
    return Math.floor(gxp / 100);
}

function getGuildLvFromStatus(upgrade_status) {
    var done_upgrades = _.where(upgrade_status, {Done: 1});
    var total_exp = _.reduce(done_upgrades, function(memo, upgrade) { return memo + upgrade.Exp_earned; }, 0);
    return getGuildLv(total_exp);
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

// MyNavBar
var MyNavBar = React.createClass({
    render: function() {
        return (
            <Navbar fixedTop inverse>
                <Navbar.Header>
                    <Navbar.Brand>
                        <a href="#">{Strings.WebsiteTitle}</a>
                    </Navbar.Brand>
                </Navbar.Header>
                <Navbar.Collapse>
                    <NavBarButtons
                        handle_login_success={this.props.handle_login_success}
                        handle_load_upgrades={this.props.handle_load_upgrades}
                        handle_load_materials={this.props.handle_load_materials}
                        handle_logout={this.props.handle_logout}
                        handle_load_from_guild_api={this.props.handle_load_from_guild_api}
                        stored_username={this.props.stored_username}
                        stored_password={this.props.stored_password}
                        upgrade_status={this.props.upgrade_status}
                        material_status={this.props.material_status}
                    />
                </Navbar.Collapse>
            </Navbar>
        );
    }
});

var ModalSignUpContent = React.createClass({
    getInitialState: function() {
        return {
            signup_status: "",
            username: "",
            password: ""
        };
    },

    cancelHandler: function() {
        this.props.close();
    },

    submitHandler: function(e) {
        e.preventDefault();

        this.setState({signup_status: "Please wait..."});
        var tmp_this = this;

        $.ajax({
            url: php_url + "signup.php",
            type: "post",
            dataType: "json",
            success: function (data) {
                var result = data.result;
                if (result == 0) {
                    tmp_this.setState({signup_status: "You've successfully signed up!"});

                    tmp_this.props.handle_login_success(tmp_this.state.username, tmp_this.state.password);

                    setTimeout(function () {
                        tmp_this.props.close();
                    }, 1000);
                } else if (result == 1) {
                    tmp_this.setState({signup_status: "This username is already used. Please try another one."});
                }
            },
            data: {
                username: this.state.username,
                password: this.state.password
            },
            error: function() {
                tmp_this.setState({signup_status: "Unknown error occurred."});
            }
        });
    },

    onUsernameChange: function(e) {
        this.setState({username: e.target.value});
    },

    onPasswordChange: function(e) {
        this.setState({password: e.target.value});
    },

    render: function() {
        return (
            <form onSubmit={this.submitHandler}>
                <Modal.Header closeButton>
                    <Modal.Title>{Strings.SignUp}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Input type="text" placeholder={Strings.Username} autoFocus value={this.state.username} onChange={this.onUsernameChange} />

                    <Input type="password" placeholder={Strings.Password} value={this.state.password} onChange={this.onPasswordChange} />
                    <div>{this.state.signup_status}</div>
                </Modal.Body>

                <Modal.Footer>
                    <Button bsStyle="default" onClick={this.cancelHandler}>{Strings.Cancel}</Button>
                    <Button type="submit" bsStyle="primary" onClick={this.submitHandler}>{Strings.Register}</Button>
                </Modal.Footer>
            </form>
        );
    }
});

var ModalLoginContent = React.createClass({
    getInitialState: function() {
        return {
            login_status: "",
            username: "",
            password: ""
        };
    },

    cancelHandler: function() {
        this.props.close();
    },

    submitHandler: function(e) {
        e.preventDefault();

        this.setState({login_status: "Please wait..."});
        var tmp_this = this;

        $.ajax({
            url: php_url + "login.php",
            type: "post",
            dataType: "json",
            success: function (data) {
                var result = data.result;
                if (result == 0) {
                    tmp_this.setState({login_status: "You've successfully logged in!"});

                    tmp_this.props.handle_login_success(tmp_this.state.username, tmp_this.state.password);

                    setTimeout(function () {
                        tmp_this.props.close();
                    }, 1000);
                } else if (result == 1) {
                    tmp_this.setState({login_status: "Your username / password is incorrect. Please try again."});
                }
            },
            data: {
                username: this.state.username,
                password: this.state.password
            },
            error: function() {
                tmp_this.setState({login_status: "Unknown error occurred."});
            }
        });
    },

    onUsernameChange: function(e) {
        this.setState({username: e.target.value});
    },

    onPasswordChange: function(e) {
        this.setState({password: e.target.value});
    },

    render: function() {
        return (
            <form onSubmit={this.submitHandler}>
                <Modal.Header closeButton>
                    <Modal.Title>{Strings.Login}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Input type="text" placeholder={Strings.Username} autoFocus value={this.state.username} onChange={this.onUsernameChange} />

                    <Input type="password" placeholder={Strings.Password} value={this.state.password} onChange={this.onPasswordChange} />
                    <div>{this.state.login_status}</div>
                </Modal.Body>

                <Modal.Footer>
                    <Button bsStyle="default" onClick={this.cancelHandler}>{Strings.Cancel}</Button>
                    <Button type="submit" bsStyle="primary" onClick={this.submitHandler}>{Strings.Login}</Button>
                </Modal.Footer>
            </form>
        );
    }
});

var ModalSaveContent = React.createClass({
    getInitialState: function() {
        return {
            save_status: ""
        };
    },

    save_data_to_server: function() {
        this.setState({save_status: "Now saving..."})

        var upgrade_save_str = JSON.stringify(R.map(R.compose(R.values, (R.pick(["Done", "Upgrade", "Want"]))))(this.props.upgrade_status));
        var material_save_str = JSON.stringify(R.pluck("amount")(this.props.material_status));

        var tmp_this = this;

        $.ajax({
            url: php_url + "save.php",
            type: "post",
            dataType: "json",
            success: function(data) {
                var result = data.result;
                if (result == 0) {
                    tmp_this.setState({save_status: "The data is successfully saved."});

                    setTimeout(function() {
                        tmp_this.props.close();
                    }, 1000);
                } else if (result == 1) {
                    tmp_this.setState({save_status: "Save error. Please try again later."});

                    setTimeout(function() {
                        tmp_this.props.close();
                    }, 1000);
                }
            },
            data: {
                username: this.props.stored_username,
                password: this.props.stored_password,
                upgrades: upgrade_save_str,
                materials: material_save_str
            },
            error: function() {
                tmp_this.setState({save_status: "Unknown error occurred."});
            }
        });
    },

    componentDidMount: function() {
        this.save_data_to_server();
    },

    render: function() {
        return (
            <div>
                <Modal.Header>
                    <Modal.Title>{Strings.Save}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div>{this.state.save_status}</div>
                </Modal.Body>
            </div>
        );
    }
});

var ModalLoadContent = React.createClass({
    getInitialState: function() {
        return {
            load_status: ""
        };
    },

    load_data_from_server: function() {
        var tmp_this = this;

        this.setState({load_status: "Now loading..."});

        $.ajax({
            url: php_url + "load.php",
            type: "post",
            dataType: "json",
            success: function(data) {
                var result = data.result;

                if (result == 0) {
                    tmp_this.props.handle_load_upgrades(JSON.parse(data.upgrades));
                    tmp_this.props.handle_load_materials(JSON.parse(data.materials));

                    tmp_this.setState({load_status: "The data is successfully loaded."});

                    setTimeout(function() {
                        tmp_this.props.close();
                    }, 1000);

                } else if (result == 1) {
                    tmp_this.setState({load_status: "Load error. Please try again later."});

                    setTimeout(function() {
                        tmp_this.props.close();
                    }, 1000);
                }
            },
            data: {
                username: this.props.stored_username
            }
        });
    },

    componentDidMount: function() {
        this.load_data_from_server();
    },

    render: function() {
        return (
            <div>
                <Modal.Header>
                    <Modal.Title>{Strings.Load}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div>{this.state.load_status}</div>
                </Modal.Body>
            </div>
        );
    }
});

var ModalLogoutContent = React.createClass({
    getInitialState: function() {
        return {
            logout_status: ""
        };
    },

    logout: function() {
        this.props.handle_logout();
    },

    componentDidMount: function() {
        this.logout();

        this.setState({logout_status: "You are successfully logged out."});

        var tmp_this = this;

        setTimeout(function() {
            tmp_this.props.close();
        }, 1000);
    },

    render: function() {
        return (
            <div>
                <Modal.Header>
                    <Modal.Title>{Strings.Logout}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div>{this.state.logout_status}</div>
                </Modal.Body>
            </div>
        );
    }
});

var ModalHelpContent = React.createClass({
    render: function() {
        return (
            <div>
                <Modal.Header closeButton>
                    <Modal.Title>{Strings.Help}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <h3>Upgrades</h3>
                    <div>
                        <ul>
                            <li>You can click on the <strong>cell</strong> of <kbd>Done</kbd> or <kbd>Want</kbd> to turn the status of each upgrade.</li>
                            <li>
                                The <kbd>Ready</kbd> has 3 status:
                                <ul>
                                    <li><span className="glyphicon glyphicon-ok" aria-hidden="true" /> means it's ready to upgrade,</li>
                                    <li><span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true" /> means you lack some materials,</li>
                                    <li><span className="glyphicon glyphicon-remove" aria-hidden="true" /> mean the guild level is not enough or it requires some other upgrades done first.</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <h3>Materials</h3>
                    <div>
                        <ul>
                            <li>You can fill the number of each material your guild has.</li>
                            <li>You can search by the name of the materials. It's case insensitive and the keywords are split by spaces.</li>
                            <li>There are currently 3 modes to show the materials:
                                <ul>
                                    <li><strong>Undone</strong> means it will show all materials from every upgrade that is remained undone.</li>
                                    <li><strong>Ready</strong> means it will show only materials from upgrade which is ready to upgrade but lack of materials.</li>
                                    <li><strong>Want</strong> means it will show only materials from upgrade which is want and undone.</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <h3>Accounts</h3>
                    <div>
                        <ul>
                            <li>In order to save your record, you need to sign up an account. <strong>Please mind don't use your primary uername/password to signup. This site doesn't use HTTPS.</strong></li>
                            <li>After you login, you can <strong>SAVE</strong> or <strong>LOAD</strong> your guild hall record.</li>
                            <li>To share the guild hall record to other players, just use <samp>http://nierrrrrrr.github.io/GW2-Guild-Hall-Controller/?username=</samp><var>your_user_name</var>, for example, if your user name is <kbd>test</kbd>, then use <kbd>http://nierrrrrrr.github.io/GW2-Guild-Hall-Controller/?username=test</kbd> to share your guild hall upgrade record.</li>
                        </ul>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <Button bsStyle="default" onClick={this.props.close}>{Strings.Close}</Button>
                </Modal.Footer>
            </div>
        );
    }
});

var ModalAPILoadContent = React.createClass({
    getInitialState: function() {
        return {
            api_key: "2A7DD814-66B7-2440-AA34-34472168A172038EF12A-C10F-49E1-83A6-11D4EE537C04",
            api_load_status: "",
            guilds: [A99331C3-07DC-E511-80D3-E4115BE8BBE8]
        };
    },

    load_guild_names: function(guild_list) {
        this.setState({api_load_status: "Loading guild names..."});

        var tmp_this = this;
        var guild_numbers = guild_list.length;
        var loaded_guild_numbers = 0;

        R.forEach(function(guild) {
            var url = "https://api.guildwars2.com/v1/guild_details.json?guild_id=" + guild.id;
            $.getJSON(url, function(data) {
                var new_guilds = guild_list;

                R.find(R.propEq("id", data.guild_id))(new_guilds).name = data.guild_name;

                tmp_this.setState({
                    guilds: new_guilds
                });

                loaded_guild_numbers += 1;
                if (loaded_guild_numbers == guild_numbers) {
                    tmp_this.setState({
                        api_load_status: "Select guild which you want to load"
                    });
                }
            });
        })(guild_list);
    },

    load_guilds: function() {
        this.setState({api_load_status: "Loading guild list..."});

        var url = "https://api.guildwars2.com/v2/account?access_token=" + this.state.api_key;

        var tmp_this = this;

        $.getJSON(url, function(data) {
            tmp_this.load_guild_names(R.map(function (id) {
                return R.fromPairs([["id", id], ["name", ""]]);
            })(data.guilds));
        }).fail(function(xhr) {
            tmp_this.setState({api_load_status: "Error: " + $.parseJSON(xhr.responseText).text});
        });
    },

    on_api_key_change: function(e) {
        this.setState({api_key: e.target.value});
    },

    item_data_ready: function(stash_data, treasury_data) {
        var group_by_id = R.groupBy(function(cell) {
            return cell.id;
        });

        var get_count_only = R.map(function(cell) {
            return R.pluck("count")(cell);
        });

        var sum_counts = R.map(function(cell) {
            return [cell[0], R.sum(cell[1])];
        });

        var add_id_key = function(cell) {
            return R.set(R.lensProp("id"), cell.item_id, cell);
        };

        var get_new_stash_data = R.compose(R.reject(R.equals(null)), R.unnest, R.pluck("inventory"));
        var get_new_treasury_data = R.map(R.compose(R.pick(["id", "count"]), add_id_key));

        var result_data = R.compose(sum_counts, R.toPairs, get_count_only, group_by_id, R.concat)(
            get_new_stash_data(stash_data),
            get_new_treasury_data(treasury_data)
        );

        this.props.handle_load_from_guild_api(result_data);

        this.setState({api_load_status: "Successfully loaded data from guild."});

        var tmp_this = this;

        setTimeout(function() {
            tmp_this.props.close();
        }, 1000);
    },

    load_data_from_guild: function(guild_id) {
        this.setState({
            api_load_status: "Load data from Guild...",
            guilds: []
        });

        var stash_data = [];
        var treasury_data = [];

        var total_result = 2;
        var current_result = 0;

        var tmp_this = this;

        // stash
        var stash_url = "https://api.guildwars2.com/v2/guild/" + guild_id + "/stash?access_token=" + this.state.api_key;

        $.getJSON(stash_url, function(data) {
            stash_data = data;
            current_result += 1;
            if (current_result == total_result) {
                tmp_this.item_data_ready(stash_data, treasury_data);
            }
        }).fail(function(xhr) {
            tmp_this.setState({api_load_status: "Error: " + $.parseJSON(xhr.responseText).text});
        });

        // treasury
        var treasury_url = "https://api.guildwars2.com/v2/guild/" + guild_id + "/treasury?access_token=" + this.state.api_key;

        $.getJSON(treasury_url, function(data) {
            treasury_data = data;
            current_result += 1;
            if (current_result == total_result) {
                tmp_this.item_data_ready(stash_data, treasury_data);
            }
        }).fail(function(xhr) {
            tmp_this.setState({api_load_status: "Error: " + $.parseJSON(xhr.responseText).text});
        });
    },

    render: function() {
        var api_send_btn = <Button onClick={this.load_guilds}><Glyphicon glyph="send" /></Button>;

        var tmp_this = this;

        var guild_list = R.map(function(guild) {
            return (
                <ListGroupItem onClick={tmp_this.load_data_from_guild.bind(tmp_this, guild.id)}>
                    {guild.name}
                </ListGroupItem>
            );
        })(this.state.guilds);

        return (
            <div>
                <Modal.Header closeButton>
                    <Modal.Title>{Strings.LoadFromAPI}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>You can apply API key from GW2 official website <a href="https://account.arena.net/applications" target="_blank">here</a></p>
                    <Input type="text" placeholder="API key" autoFocus value={this.state.api_key} onChange={this.on_api_key_change} buttonAfter={api_send_btn} />
                    <div>{this.state.api_load_status}</div>
                    <hr />
                    <ListGroup>{guild_list}</ListGroup>
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle="default" onClick={this.props.close}>{Strings.Close}</Button>
                </Modal.Footer>
            </div>
        );
    }
});

var NavBarButton = React.createClass({
    getInitialState: function() {
        return {showModal: false}
    },

    close: function() {
        this.setState({showModal: false});
    },

    open: function() {
        this.setState({showModal: true});
    },

    render: function() {
        var tmp_this = this;

        var children_with_props = React.Children.map(this.props.children, function(child) {
            return React.cloneElement(child, {
                close: tmp_this.close
            });
        });

        return (
            <NavItem onClick={this.open}>
                {this.props.btntext}
                <Modal show={this.state.showModal} onHide={this.close}>
                    {children_with_props}
                </Modal>
            </NavItem>
        );
    }
});

var NavBarButtons = React.createClass({
    render: function() {
        var nav_bar_buttons = [];

        if (this.props.stored_password == "") {
            // not logged in
            nav_bar_buttons.push(
                <NavBarButton btntext={Strings.Register} key="signup">
                    <ModalSignUpContent handle_login_success={this.props.handle_login_success} />
                </NavBarButton>
            );
            nav_bar_buttons.push(
                <NavBarButton btntext={Strings.Login} key="login">
                    <ModalLoginContent handle_login_success={this.props.handle_login_success} />
                </NavBarButton>
            );
        } else {
            // logged in
            nav_bar_buttons.push(
                <NavBarButton btntext={Strings.Save} key="save">
                    <ModalSaveContent
                        stored_username={this.props.stored_username}
                        stored_password={this.props.stored_password}
                        upgrade_status={this.props.upgrade_status}
                        material_status={this.props.material_status}
                    />
                </NavBarButton>
            );
            nav_bar_buttons.push(
                <NavBarButton btntext={Strings.Load} key="load">
                    <ModalLoadContent
                        stored_username={this.props.stored_username}
                        handle_load_upgrades={this.props.handle_load_upgrades}
                        handle_load_materials={this.props.handle_load_materials}
                    />
                </NavBarButton>
            );
            nav_bar_buttons.push(
                <NavBarButton btntext={Strings.Logout} key="logout">
                    <ModalLogoutContent
                        handle_logout={this.props.handle_logout}
                    />
                </NavBarButton>
            );
        }

        nav_bar_buttons.push(
            <NavBarButton btntext={Strings.LoadFromAPI} key="apiload">
                <ModalAPILoadContent
                    handle_load_from_guild_api={this.props.handle_load_from_guild_api}
                />
            </NavBarButton>
        );

        nav_bar_buttons.push(
            <NavBarButton btntext={Strings.Help} key="help">
                <ModalHelpContent />
            </NavBarButton>
        );

        return (
            <Nav pullRight>
                {nav_bar_buttons}
            </Nav>
        );
    }
});

var GuildStatusLevel = React.createClass({
    render: function() {
        var upgrade_status = this.props.upgrade_status;
        var done_upgrades = _.where(upgrade_status, {Done: 1});
        var total_exp = _.reduce(done_upgrades, function(memo, upgrade) { return memo + upgrade.Exp_earned; }, 0);
        var guild_lv = getGuildLv(total_exp);
        var percentage = total_exp % 100;
        var next_exp = total_exp - percentage + 100;

        return (
            <div className="guild_level">
                <h2 id="guild_lv">{Strings.LevelShort + " " + guild_lv}</h2>
                <div className="progress">
                    <div
                        className="progress-bar"
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        style={{width: percentage + "%"}} id="gxp_bar">
                        {total_exp.toString() + " / " + next_exp.toString()}
                    </div>
                </div>
            </div>
        )
    }
});

var GuildStatus = React.createClass({
    render: function() {
        return (
            <div className="guild_status">
                <h1>{Strings.WebsiteTitle}</h1>
                <hr/>
                <GuildStatusLevel upgrade_status={this.props.upgrade_status} />
                <hr/>
            </div>
        );
    }
});

var TabUpgradeListStructOptBtn = React.createClass({
    onFilterClick: function() {
        this.props.on_filter_click(this.props.text);
    },

    render: function() {
        return <button type="button" className={this.props.class_text} onClick={this.onFilterClick}>{this.props.text}</button>;
    }
});

var TabUpgradeListStructOpt = React.createClass({
    render: function() {
        var tmp_this = this;
        var options = _.map(this.props.upgrade_filter, function(value, key) {
            return <TabUpgradeListStructOptBtn class_text={"btn " + (value ? "btn-primary" : "btn-default")} key={key} text={key} on_filter_click={tmp_this.props.on_filter_click} />;
        });

        return (
            <div id="upgrade_structure_opt" className="btn-group">
                {options}
            </div>
        );
    }
});

var TabUpgradeListHeaderRow = React.createClass({
    render: function() {
        var tmp_this = this;

        var class_name = classNames({
            "tablesorter-header": true,
            "tablesorter-headerUnSorted": tmp_this.props.sort[0] != tmp_this.props.index,
            "tablesorter-headerAsc": tmp_this.props.sort[0] == tmp_this.props.index && tmp_this.props.sort[1] == true,
            "tablesorter-headerDesc": tmp_this.props.sort[0] == tmp_this.props.index && tmp_this.props.sort[1] == false
        });

        if (upgrade_sorterable[this.props.index] == false) {
            class_name = "tablesorter-header tablesorter-headerUnSorted sorter-false";
        }

        return (
            <th className={class_name} onClick={this.props.on_click_sort}>
                <div className="tablesorter-header-inner">{this.props.header_title}</div>
            </th>
        );
    }
});

var TabUpgradeListRowMaterial = React.createClass({
    render: function() {
        var img_classname = classNames({
            upgrade_material_not_enough: !this.props.done && this.props.status.amount < this.props.need
        });

        var tooltip = (
            <Tooltip id={this.props.name}>{this.props.name}</Tooltip>
        );

        return (
            <OverlayTrigger placement="top" overlay={tooltip} >
                <span className="img_wrapper upgrade_material">
                    <img src={this.props.status.img_src} alt={this.props.name} height="40" width="40" className={img_classname} />
                    <p className="material_img_num">{this.props.need}</p>
                </span>
            </OverlayTrigger>
        );
    }
});

function get_upgrade_ready(upgrade, guild_lv, material_status, upgrade_status) {
    // if Done, then it's Ready
    if (upgrade.Done == 1) return 2;

    // check level & hierarchy
    if (upgrade.LevelRequire > guild_lv) return 0;
    if (R.all(R.propEq("Done", 1), R.filter(u => R.contains(u.Upgrade, R.pluck("Need", R.filter(R.propEq("Upgrade", upgrade.Upgrade), UpgradeHierarchy))), upgrade_status)) == false) return 0;

    // check materials are all ok
    if (R.all(material => material_status[material.ItemId].amount >= material.ItemQuantity, R.filter(R.propEq("Upgrade", upgrade.Upgrade), MaterialList)) == true) return 2;
    else return 1;
}

var TabUpgradeListRow = React.createClass({
    on_click_want: function() {
        this.props.on_want_click(this.props.upgrade.Upgrade);
    },

    on_click_done: function() {
        this.props.on_done_click(this.props.upgrade.Upgrade);
    },

    render: function() {
        var tr_class_str = "";
        var ready = this.props.upgrade.Ready;
        if (this.props.upgrade.Done) {
            tr_class_str = "success";
        } else if (ready == 2) {
            tr_class_str = "info";
        } else if (ready == 1) {
            tr_class_str = "warning";
        }

        var tmp_this = this;
        var material_status = this.props.material_status;
        var materials = _.where(MaterialList, {Upgrade: this.props.upgrade.Upgrade});
        var materials_td = _.map(materials, function(material) {
            return <TabUpgradeListRowMaterial status={material_status[material.ItemId]} name={material.ItemName} key={material.ItemId} need={material.ItemQuantity} done={tmp_this.props.upgrade.Done} />;
        });

        return (
            <tr className={tr_class_str}>
                <td className="vert-align">{this.props.upgrade.Structure}</td>
                <td className="vert-align upgrade_name">{this.props.upgrade.Upgrade}</td>
                <td className="vert-align">{this.props.upgrade.LevelRequire}</td>
                <td className="want vert-align" onClick={this.on_click_want}><Glyphicon glyph={this.props.upgrade.Want == 1 ? "ok" : "remove"} /></td>
                <td className="done vert-align" onClick={this.on_click_done}><Glyphicon glyph={this.props.upgrade.Done == 1 ? "ok" : "remove"} /></td>
                <td className="ready vert-align"><Glyphicon glyph={ready == 2 ? "ok" : ready == 1 ? "exclamation-sign" : "remove"} /></td>
                <td className="vert-align">{this.props.upgrade.Exp_earned}</td>
                <td className="vert-align">{this.props.upgrade.Aetherium}</td>
                <td className="vert-align">{this.props.upgrade.Valor}</td>
                <td className="vert-align">{this.props.upgrade.Gold / 10000}</td>
                <td width="25%">{materials_td}</td>
            </tr>
        );
    }
});

var TabUpgradeListTable = React.createClass({
    getInitialState: function() {
        return {
            sort: [2, true]     // index, Asc
        };
    },

    update_sort: function(index) {
        if (upgrade_sorterable[index] == false) return;

        var new_sort = this.state.sort;

        if (new_sort[0] == index) {
            new_sort[1] = !new_sort[1];
        } else {
            new_sort[0] = index;
            new_sort[1] = true;
        }

        this.setState({sort: new_sort});
    },

    get_sorted_upgrades: function(upgrade_status, material_status) {
        var result = null;
        switch(this.state.sort[0]) {
            case 0: // Structure
                result = _.sortBy(upgrade_status, "Structure");
                break;
            case 1: // Upgrade
                result = _.sortBy(upgrade_status, "Upgrade");
                break;
            case 2: // Guild Lv
                result = _.sortBy(upgrade_status, "LevelRequire");
                break;
            case 3: // Want
                result = _.sortBy(upgrade_status, "Want");
                break;
            case 4: // Done
                result = _.sortBy(upgrade_status, "Done");
                break;
            case 5: // Ready
                result = _.sortBy(upgrade_status, "Ready");
                break;
            case 6: // GXP
                result = _.sortBy(upgrade_status, "Exp_earned");
                break;
            case 7: // Aetherium
                result = _.sortBy(upgrade_status, "Aetherium");
                break;
            case 8: // Valor
                result = _.sortBy(upgrade_status, "Valor");
                break;
            case 9: // Gold
                result = _.sortBy(upgrade_status, "Gold");
                break;
        }

        return this.state.sort[1] ? result : result.reverse();
    },

    append_ready_upgrade: function(upgrade, guild_lv, material_status, upgrade_status) {
        upgrade.Ready = get_upgrade_ready(upgrade, guild_lv, material_status, upgrade_status);
        return upgrade;
    },

    render: function() {
        var tmp_this = this;
        var guild_lv = getGuildLvFromStatus(this.props.upgrade_status);

        var headers = _.map(Strings.UpgradeHeaders, function (header_title, index) {
            var on_click_event = tmp_this.update_sort.bind(tmp_this, index);
            return <TabUpgradeListHeaderRow header_title={header_title} index={index} key={index} on_click_sort={on_click_event} sort={tmp_this.state.sort} />;
        });

        var sorted_ready_upgrades = this.get_sorted_upgrades(R.map(R.partialRight(this.append_ready_upgrade, [guild_lv, this.props.material_status, this.props.upgrade_status]), this.props.upgrade_status));

        var rows = _.map(sorted_ready_upgrades, function (upgrade) {
            if (tmp_this.props.upgrade_filter[upgrade.Structure]) {
                return <TabUpgradeListRow
                    upgrade={upgrade}
                    material_status={tmp_this.props.material_status}
                    guild_lv={guild_lv}
                    key={upgrade.Upgrade}
                    on_want_click={tmp_this.props.on_want_click}
                    on_done_click={tmp_this.props.on_done_click}
                />
            } else {
                return null;
            }
        });

        return (
            <table className="table table-hover table-condensed tablesorter tablesorter-default" id="upgrade_list">
                <thead>
                <tr>{headers}</tr>
                </thead>
                <ReactCSSTransitionGroup component="tbody" transitionName="upgrade_row" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
                    {rows}
                </ReactCSSTransitionGroup>
            </table>
        );
    }
});

var TabUpgradeList = React.createClass({
    getInitialState: function () {
        return {upgrade_filter: _.mapObject(_.object(_.uniq(_.pluck(this.props.upgrade_status, "Structure")), new Array(this.props.upgrade_status.length)), function(){return true;})};
    },

    onFilterClick: function(structure) {
        var tmp_upgrade_filter = this.state.upgrade_filter;
        tmp_upgrade_filter[structure] = !tmp_upgrade_filter[structure];
        this.setState({upgrade_filter: tmp_upgrade_filter});
    },

    render: function() {
        return (
            <div>
                <h2>{Strings.GuildHallUpgradeList}</h2>
                <TabUpgradeListStructOpt
                    upgrade_filter={this.state.upgrade_filter}
                    on_filter_click={this.onFilterClick}
                />
                <TabUpgradeListTable
                    upgrade_status={this.props.upgrade_status}
                    material_status={this.props.material_status}
                    upgrade_filter={this.state.upgrade_filter}
                    on_want_click={this.props.on_want_click}
                    on_done_click={this.props.on_done_click}
                />
            </div>
        );
    }
});

var TabMaterialListOptElem = React.createClass({
    on_option_click: function(option) {
        this.props.on_click_option(option);
    },

    render: function() {
        var class_name = classNames({
            "btn": true,
            "btn-primary": this.props.option == this.props.text,
            "btn-default": this.props.option != this.props.text,
            "material_option": true
        });

        return (
            <button type="button" className={class_name} onClick={this.on_option_click.bind(this, this.props.text)}>{this.props.text}</button>
        );
    }
});

var TabMaterialListOpt = React.createClass({
    render: function() {
        var tmp_this = this;
        var option_elems = _.map([Strings.Undone, Strings.Ready, Strings.Want], function(option_text) {
            return <TabMaterialListOptElem option={tmp_this.props.option} text={option_text} on_click_option={tmp_this.props.on_click_option} key={option_text} />;
        });

        return (
            <div className="col-sm-4">
                {option_elems}
            </div>
        );
    }
});

var TabMaterialListFilter = React.createClass({
    handle_change: function() {
        this.props.on_search_text_change(this.refs.search_input.value);
    },

    render: function() {
        return (
            <div className="col-sm-4">
                <div className="input-group stylish-input-group">
                    <input type="text" className="form-control material_search" placeholder={Strings.Search} ref="search_input" onChange={this.handle_change} />
                    <span className="input-group-addon">
                        <span className="glyphicon glyphicon-search" />
                    </span>
                </div>
            </div>
        );
    }
});

var TabMaterialListTable = React.createClass({
    on_amount_change: function(item_id, e) {
        var value = parseInt(e.target.value) || 0;
        this.props.handle_amount_change(item_id, value);
    },

    render: function() {
        var headers = _.map(Strings.MaterialHeaders, function(header_text) {
            return <th key={header_text}>{header_text}</th>;
        });

        var tmp_this = this;

        var search_text_array = this.props.search_text.toLowerCase().match(/\S+/g);

        var filtered_upgrades = this.props.upgrade_status;

        switch (tmp_this.props.option) {
            case Strings.Undone:
                filtered_upgrades = _.pluck(_.where(filtered_upgrades, {Done: 0}), "Upgrade");
                break;
            case Strings.Ready:
                filtered_upgrades = _.pluck(_.where(filtered_upgrades, {Ready: 1}), "Upgrade");
                break;
            case Strings.Want:
                filtered_upgrades = _.pluck(_.where(filtered_upgrades, {Want: 1}), "Upgrade");
                break;
        }

        var rows = _.map(this.props.material_status, function(material, item_id) {
            if (_.some(search_text_array, function(text) {
                if (material.name.toLowerCase().indexOf(text) < 0) {
                    return true;
                }
            }) == true) {
                return null;
            }

            var needed = _.reduce(
                _.filter(MaterialList, function(upgrade_material) {
                    return _.indexOf(filtered_upgrades, upgrade_material.Upgrade) >= 0 && item_id == upgrade_material.ItemId;
                }),
                function(memo, upgrade_material) {
                    return memo + upgrade_material.ItemQuantity;
                },
                0
            );

            if (needed == 0) {
                return null;
            }

            var price_elem = null;

            if (material.flags.indexOf("AccountBound") == -1) {
                var gold = Math.floor(material.sell_price / 10000);
                var silver = Math.floor(material.sell_price / 100) % 100;
                var copper = material.sell_price % 100;
                price_elem = (
                    <div>
                        {gold.toString()}&nbsp;<img src="./Content/Gold_coin.png" alt="Gold" />&nbsp;
                        {silver.toString()}&nbsp;<img src="./Content/Silver_coin.png" alt="Silver" />&nbsp;
                        {copper.toString()}&nbsp;<img src="./Content/Copper_coin.png" alt="Copper" />
                    </div>
                )
            } else {
                price_elem = (
                    <div>{Strings.AccountBound}</div>
                )
            }

            return (
                <tr className="material_row" key={item_id}>
                    <td className="material_name">
                        <img height="40" width="40" src={material.img_src} />
                        <a href={encodeURI("http://wiki.guildwars2.com/wiki/" + material.name)} target="_blank">{material.name}</a>
                    </td>
                    <td className="material_price vert-align">
                        {price_elem}
                    </td>
                    <td className="needed vert-align">{needed}</td>
                    <td className="vert-align"><input type="number" min="0" className="had" value={material.amount} ref="amount" onChange={tmp_this.on_amount_change.bind(tmp_this, item_id)} /></td>
                    <td className="vert-align">{needed - material.amount}</td>
                </tr>
            );
        });

        return (
            <table className="table table-hover table-condensed tablesorter" id="material_list">
                <thead>
                    <tr>{headers}</tr>
                </thead>
                <ReactCSSTransitionGroup component="tbody" transitionName="upgrade_row" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
                    {rows}
                </ReactCSSTransitionGroup>
            </table>
        );
    }
});

var TabMaterialListHeader = React.createClass({
    render: function() {
        return (
            <div className="row vertical-align">
                <div className="col-sm-4">
                    <h2>{Strings.MaterialList}</h2>
                </div>
                <TabMaterialListOpt option={this.props.option} on_click_option={this.props.on_click_option} />
                <TabMaterialListFilter on_search_text_change={this.props.on_search_text_change} />
            </div>
        );
    }
});

var TabMaterialList = React.createClass({
    getInitialState: function() {
        return {
            option: Strings.Undone,
            search_text: ""
        }
    },

    on_click_option: function(option) {
        this.setState({option: option});
    },

    on_search_text_change: function(text) {
        this.setState({search_text: text});
    },

    render: function() {
        return (
            <div>
                <TabMaterialListHeader option={this.state.option} on_click_option={this.on_click_option} on_search_text_change={this.on_search_text_change} />
                <TabMaterialListTable
                    option={this.state.option}
                    search_text={this.state.search_text}
                    upgrade_status={this.props.upgrade_status}
                    material_status={this.props.material_status}
                    handle_amount_change={this.props.handle_amount_change}
                />
            </div>
        );
    }
});

var TabContent = React.createClass({
    render: function() {
        return (
            <Tabs defaultActiveKey={1}>
                <Tab eventKey={1} title={Strings.Upgrades}>
                    <TabUpgradeList
                        upgrade_status={this.props.upgrade_status}
                        material_status={this.props.material_status}
                        on_want_click={this.props.on_want_click}
                        on_done_click={this.props.on_done_click}
                    />
                </Tab>
                <Tab eventKey={2} title={Strings.Materials}>
                    <TabMaterialList
                        upgrade_status={this.props.upgrade_status}
                        material_status={this.props.material_status}
                        handle_amount_change={this.props.handle_amount_change}
                    />
                </Tab>
            </Tabs>
        );
    }
});

var MainContent = React.createClass({
    render: function() {
        return (
            <div className="container">
                <GuildStatus upgrade_status={this.props.upgrade_status} />
                <TabContent
                    upgrade_status={this.props.upgrade_status}
                    material_status={this.props.material_status}
                    on_want_click={this.props.on_want_click}
                    on_done_click={this.props.on_done_click}
                    handle_amount_change={this.props.handle_amount_change}
                />
            </div>
        );
    }
});

var LoadFromURLModal = React.createClass({
    render: function() {
        return (
            <Modal show={this.props.status}>
                <ModalLoadContent
                    stored_username={this.props.stored_username}
                    handle_load_upgrades={this.props.handle_load_upgrades}
                    handle_load_materials={this.props.handle_load_materials}
                    close={this.props.handle_load_url_over}
                />
            </Modal>
        );
    }
});

var PageRoot = React.createClass({
    loadImgSrcFromAPI: function() {
        var url = "https://api.guildwars2.com/v2/items?lang=en&ids=" + _.uniq(_.pluck(MaterialList, "ItemId")).toString();

        var new_material_status = this.state.material_status;

        var tmp_this = this;

        $.getJSON(url, function(data) {
            _.each(data, function(d) {
                new_material_status[d.id].img_src = d.icon;
                new_material_status[d.id].name = d.name;
                new_material_status[d.id].flags = d.flags;
            });

            tmp_this.setState({material_status: new_material_status});
        });
    },

    loadItemPriceFromAPI: function() {
        var url = "https://api.guildwars2.com/v2/commerce/prices?lang=en&ids=" + _.uniq(_.pluck(MaterialList, "ItemId")).toString();

        var new_material_status = this.state.material_status;

        var tmp_this = this;

        $.getJSON(url, function(data) {
            _.each(data, function(d) {
                new_material_status[d.id].sell_price = d.sells.unit_price;
                new_material_status[d.id].buy_price = d.buys.unit_price;
            });

            tmp_this.setState({material_status: new_material_status});
        });
    },

    loadDataFromURL: function() {
        if (QueryString.username != undefined) {
            this.handleLogOut();
            this.setState({
                stored_username: QueryString.username,
                load_from_url_status: true
            });
        }
    },

    handleLoadURLOver: function() {
        this.setState({load_from_url_status: false});
    },

    handleWantGlyphClick: function(upgrade) {
        var tmp_upgrade_status = this.state.upgrade_status;
        var row = _.findWhere(tmp_upgrade_status, {Upgrade: upgrade});
        row.Want = (row.Want == 0 ? 1 : 0);

        this.setState({upgrade_status: tmp_upgrade_status});
    },

    handleDoneGlyphClick: function(upgrade) {
        var tmp_upgrade_status = this.state.upgrade_status;
        var row = _.findWhere(tmp_upgrade_status, {Upgrade: upgrade});
        row.Done = (row.Done == 0 ? 1 : 0);

        this.setState({upgrade_status: tmp_upgrade_status});
    },

    handleAmountChange: function(item_id, amount) {
        var new_material_status = this.state.material_status;
        new_material_status[item_id].amount = amount;
        this.setState({material_status: new_material_status});
    },

    handleLoginSuccess: function(username, password) {
        this.setState({
            stored_username: username,
            stored_password: password
        });
    },

    handleLoadUpgrades: function(upgrades_data) {
        var new_upgrade_status = this.state.upgrade_status;
        R.forEach(function(upgrade_array) {
            var done = upgrade_array[0];
            var upgrade_name = upgrade_array[1];
            var want = upgrade_array[2];

            var row = R.find(R.propEq('Upgrade', upgrade_name))(new_upgrade_status);
            row.Want = want;
            row.Done = done;
        })(upgrades_data);

        this.setState({upgrade_status: new_upgrade_status});
    },

    handleLoadMaterials: function(materials_data) {
        var new_material_status = this.state.material_status;

        R.compose(R.forEach(function(material_array){
            var item_id = material_array[0];
            var item_amount = material_array[1];

            new_material_status[item_id].amount = item_amount;
        }), R.toPairs())(materials_data);

        this.setState({material_status: new_material_status});
    },

    handleLogOut: function() {
        this.setState({
            stored_username: "",
            stored_password: ""
        });
    },

    handleLoadFromGuildAPI: function(data) {

        var set_amount_zero = R.set(R.lensProp("amount"), 0);
        var new_material_status = R.mapObjIndexed(set_amount_zero)(this.state.material_status);

        R.forEach(function(cell) {
            var item_id = cell[0];
            var amount = cell[1];

            if (R.has(item_id)(new_material_status)) {
                new_material_status[item_id].amount = amount;
            }
        })(data);

        this.setState({material_status: new_material_status});
    },

    getInitialState: function () {
        var arr = _.uniq(_.pluck(MaterialList, "ItemId"));
        var default_materials = _.mapObject(_.object(arr, new Array(arr.length)), function() {
            return {
                amount: 0,
                flags: "",
                img_src: "",
                name: "",
                sell_price: 0,
                buy_price: 0
            };
        });

        return {
            upgrade_status: UpgradeList,
            material_status: default_materials,
            stored_username: "",
            stored_password: "",
            guild_api: "",
            load_from_url_status: false
        };
    },

    componentDidMount: function() {
        this.loadImgSrcFromAPI();
        this.loadItemPriceFromAPI();
        this.loadDataFromURL();
    },

    render: function() {
        return (
            <div>
                <MyNavBar
                    handle_login_success={this.handleLoginSuccess}
                    handle_load_upgrades={this.handleLoadUpgrades}
                    handle_load_materials={this.handleLoadMaterials}
                    handle_logout={this.handleLogOut}
                    handle_load_from_guild_api={this.handleLoadFromGuildAPI}
                    stored_username={this.state.stored_username}
                    stored_password={this.state.stored_password}
                    upgrade_status={this.state.upgrade_status}
                    material_status={this.state.material_status}
                />
                <MainContent
                    upgrade_status={this.state.upgrade_status}
                    material_status={this.state.material_status}
                    on_want_click={this.handleWantGlyphClick}
                    on_done_click={this.handleDoneGlyphClick}
                    handle_amount_change={this.handleAmountChange}
                />
                <LoadFromURLModal
                    status={this.state.load_from_url_status}
                    stored_username={this.state.stored_username}
                    handle_load_upgrades={this.handleLoadUpgrades}
                    handle_load_materials={this.handleLoadMaterials}
                    handle_load_url_over={this.handleLoadURLOver}
                />
            </div>
        );
    }
});

ReactDOM.render(
    <PageRoot />,
    $("#content")[0]
);
