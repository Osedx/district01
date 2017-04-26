import { Component, ViewChild, ElementRef, OnInit } from "@angular/core";
import * as moment from "moment";
import { PlaylistState } from "../../services/playlist-state.service";
import { NgSemanticModule } from "ng-semantic";
import { DataService } from "../../../services/data.service";
import { AF } from "../../../providers/af";

@Component({
  selector: "app-personalvideolist",
  templateUrl: "personalvideolist.component.html",
  styleUrls: ["personalvideolist.component.scss"]
})
export class PersonalVideoListComponent implements OnInit {
    @ViewChild("playlistplayer") playlistplayer : ElementRef;
    _subscription : any;
    notFound = false;
    constructor( private playlistState : PlaylistState, private dataservice : DataService, private afService : AF) {
        this.playlistState.isPlaying = false;
        this.playlistState.playList = [];
    }
    ngOnInit() {
        if (typeof this.afService.uid !== "undefined") {
            this.getOwnPlaylist(this.afService.uid);
        }
        else {
            this._subscription = this.afService.changeId.subscribe((userid : string) => {
            this.getOwnPlaylist(userid);
        }); }
        this.playlistState.activeVideo = undefined;
    }
    getOwnPlaylist(id : string) {
        this.dataservice.getOwnPlaylist(id).subscribe(
            data => {
//            console.log("Own videos " + data.json());
            this.playlistState.playList = data.json();
               if (this.playlistState.playList.length === 0) this.notFound = true;
                else this.notFound = false;
            },
    error => { console.log(error); } ); }
    stop() {
        if (typeof this.playlistplayer === "undefined") return;
        this.playlistplayer.nativeElement.contentWindow.postMessage(JSON.stringify({"event" : "command", "func" : "stopVideo", "args" : "" || [] }), "*");
        this.playlistState.isPlaying = false;
    }
}