// Components, functions, plugins
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, NgModule } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { LeafletDirective } from '@asymmetrik/ngx-leaflet/dist';
import * as L from "leaflet";

@Component({
  selector: 'page-help',
  templateUrl: 'help.html',
})

export class HelpPage {
	
	// Leaflet mapping variables
	myMap: any;

	constructor(public navCtrl: NavController) {
	}

	ionViewDidLoad() {
		console.log('ionViewDidLoad HelpPage');
	}
	
	ngOnInit() {
		
		// Help Desk location
		var y = 580;
		var x = 1670;
		var RoomName = "NAEYC Homeroom";
		
		// Simple coordinate system mapping
		console.log('Simple coordinate system mapping');
		this.myMap = L.map('map2', {
			crs: L.CRS.Simple,
			minZoom: -2,
			maxZoom: 0,
			zoomControl: true
		});

		var bounds = L.latLngBounds([0, 0], [1200, 2100]);    // Normally 1000, 1000; stretched to 2000,1000 for AACD 2017

		var image = L.imageOverlay('assets/img/level1.png', bounds, {
			attribution: 'Convergence'
		}).addTo(this.myMap);
		
		this.myMap.fitBounds(bounds);
		this.myMap.setMaxBounds(bounds);

		var SessionName = L.latLng([y, x]);

		L.marker(SessionName).addTo(this.myMap)
			.bindPopup(RoomName)
			.openPopup();

		this.myMap.setView([y, x], 1);

	}
	
}
