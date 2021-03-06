import Snackbar from "../../snackbar";
import cssClass from "./style.scss";
import React from "react";
import { AppBar } from "react-toolbox/lib/app_bar";
import { ProgressBar } from "react-toolbox/lib/progress_bar";
import { List, ListItem, ListSubHeader } from "react-toolbox/lib/list";
import { browserHistory } from "react-router";

let unlock_time = 0, unlock_clicks = 1;

export default class Index extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            syncing: false,
            loading: true,
            showHidden: localStorage["showHidden"],
            updateTime: new Date().toLocaleString(),
            group: []
        };
        this.onLock = this.onLock.bind(this);
        this.onUnlock = this.onUnlock.bind(this);
        this.onSync = this.onSync.bind(this);
    }

    loadData() {
        this.setState({ loading: true });
        fetch("/projects.json")
            .then(response => response.json())
            .then(data => {
                this.setState({ loading: false, group: data.group, updateTime: new Date(data.updateTime).toLocaleString(), });
            }).catch(() => {
                Snackbar.Show({
                    content: "Failed to load data.",
                    icon: "warning",
                    action: "RELOAD",
                    onAction: hide => {
                        this.loadData();
                        hide();
                    }
                });
            });
    }

    componentDidMount() {
        window.hideLoadingDiv();
        this.loadData();
    }

    componentWillUnmount() {
        Snackbar.Hide();
    }

    onSync() {
        if (this.state.syncing) return;
        Snackbar.Show({
            content: "Synchronizing...",
            timeout: 3000
        });
        this.setState({ syncing: true });
    }

    onUnlock() {
        if (this.state.showHidden) return;
        if (Date.now() - unlock_time > 1000) {
            unlock_time = Date.now();
            unlock_clicks = 1;
            return;
        }
        if (unlock_clicks < 5) {
            unlock_clicks++;
        } else {
            localStorage["showHidden"] = true;
            this.setState({ showHidden: true });
            let root = document.querySelector("#container");
            root.scrollTop = root.scrollHeight;
            Snackbar.Show({
                content: "Displaying all projects",
                timeout: 3000,
                action: "UNDO",
                onAction: (hide) => { this.onLock(); hide(); }
            });
        }
    }

    onLock() {
        if (!this.state.showHidden) return;
        delete localStorage["showHidden"];
        this.setState({ showHidden: false });
    }

    redirect(target, e) {
        e.preventDefault();
        browserHistory.push(target);
    }

    render() {
        return <div>
            <AppBar fixed title="KK's Mirror" />
            {this.state.loading ? <ProgressBar mode='indeterminate' /> : []}
            {this.state.group.filter(x => this.state.showHidden || !x.hidden).map(group => {
                return <List key={group.name} ripple className={this.state.loading ? cssClass.hidden : cssClass.container}>
                    <ListSubHeader caption={group.name} />
                    {group.project.filter(x => this.state.showHidden || !x.hidden).map(project => {
                        return <ListItem key={project.folder} avatar={project.image || require("../../images/folder.png")} caption={project.name} legend={project.description} to={`/${project.folder}/`} onClick={this.redirect.bind(this, `/${project.folder}/`)} />;
                    })}
                </List>;
            })}
            <List ripple className={this.state.loading ? cssClass.hidden : cssClass.container}>
                <ListSubHeader caption='Sync Project' />
                {this.state.showHidden ? <ListItem leftIcon="visibility_off" caption="Hide Blocked Project" legend="Hide projects which is not allow to post here" onClick={this.onLock} /> : []}
                <ListItem disabled={this.state.syncing} leftIcon="sync" caption="Sync" legend={this.state.syncing ? "Syncing..." : "Last sync at " + this.state.updateTime} onClick={this.onSync} />
                <ListItem leftIcon="send" caption="Feedback" legend="Contact server manager" to="mailto:kookxiang@gmail.com?subject=KK's Mirror Feedback" />
                <ListItem leftIcon="info" caption="About KK's Mirror" legend="V2.0.0 Beta" onClick={this.onUnlock} />
            </List>
        </div>;
    }
}
