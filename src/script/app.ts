/// <reference path="../../typings/angular2/angular2.d.ts" />

import {Component, View, bootstrap, For, DynamicComponentLoader} from 'angular2/angular2';
import {bind, Inject} from 'angular2/di';
import {ChangeDetection, DynamicChangeDetection} from 'angular2/change_detection';

@Component({
    selector: 'app',
    injectables: [DynamicComponentLoader]
})
@View({
    directives: [For],
    template: `<div class=\"container\">\n    <div class=\"row\">\n        <div class=\"col-xs-3\">\n            <div class=\"well\">\n                <button class=\"btn btn-block btn-default\" (click)=\"newSite()\">Add Site</button>\n                <button class=\"btn btn-block btn-default\">Add Group</button>\n            </div>\n        </div>\n        <div class=\"col-xs-6\">\n            <ul>\n                <li *for=\"#site of sites\">\n                    {{ site.url }}\n                </li>\n            </ul>            \n        </div>\n        <div class=\"col-xs-3\">\n            <pre>{{ json() }}</pre>\n        </div>\n    </div>\n</div>\n`
})
class AppComponent {
    sites:Array<Site> = [];
    loader:DynamicComponentLoader;

    constructor(loader:DynamicComponentLoader) {
        this.loader = loader;
        this.sites.push(new Site('http://google.com'));
        this.sites.push(new Site('http://yahoo.com'));
        setTimeout(()=> {
            this.sites.push(new Site('http://google.com'));
            this.sites.push(new Site('http://yahoo.com'));
        }, 1000);
    }

    json():string {
        return JSON.stringify({
            sites: this.sites
        }, null, 2);
    }

    newSite():void {
        this.loader.loadIntoExistingLocation('<modal></modal>', this);
    }
}

@Component({
    selector: 'modal'
})
@View({
    template: `<div class=\"modal fade\">\n    <div class=\"modal-dialog\">\n        <div class=\"modal-content\">\n            <div class=\"modal-header\">\n                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n                <h4 class=\"modal-title\">Modal title</h4>\n            </div>\n            <div class=\"modal-body\">\n                <p>One fine body&hellip;</p>\n            </div>\n            <div class=\"modal-footer\">\n                <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n                <button type=\"button\" class=\"btn btn-primary\">Save changes</button>\n            </div>\n        </div>\n    </div>\n</div>`
})
class Modal {
    static show() {

    }
}

class Site {
    url:string;

    constructor(url:string) {
        this.url = url;
    }
}

bootstrap(AppComponent, [bind(ChangeDetection).toClass(DynamicChangeDetection)]);
