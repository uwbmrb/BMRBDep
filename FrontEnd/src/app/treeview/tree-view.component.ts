import {Component, Input, OnInit} from '@angular/core';
import {ApiService} from '../api.service';
import {ActivatedRoute, Router} from '@angular/router';
import {download} from '../nmrstar/nmrstar';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.css']
})
export class TreeViewComponent implements OnInit {
  active: string;
  developerMode: boolean;
  page: string;
  @Input() showInvalidOnly: boolean;

  constructor(public api: ApiService,
              private router: Router,
              private route: ActivatedRoute) {
    this.developerMode = false;
    this.page = '?';
  }

  ngOnInit() {

    const parent = this;
    this.router.events.subscribe(() => {
      let r = this.route;
      while (r.firstChild) {
        r = r.firstChild;
      }
      r.params.subscribe(params => {
        if (params['saveframe_description'] !== undefined) {
          parent.active = params['saveframe_description'];
        }
        parent.showInvalidOnly = this.router.url.endsWith('/review');
        const urlSegments = this.router.url.split('/');
        parent.page = urlSegments[urlSegments.length - 1];
      });
    });
  }

  download(name: string, printable_object): void {
    download(name, printable_object);
  }

  logEntry(): void {
    console.log(this.api.cachedEntry);
  }

  refresh(): void {
    localStorage.removeItem('entry_key');
    localStorage.removeItem('entry');
    localStorage.removeItem('schema');
    window.location.reload();
  }

  scrollSideNav(): void {
    window.setTimeout(() => {
      if (this.page === 'category') {
        document.getElementById(this.active).parentElement.scrollIntoView();
      }
    }, 500);
  }
}