import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { LatLng } from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.initMap();
  }

  private initMap(): void {
    const latlong = new LatLng(6.1247736, 100.3914772);
    const destLatLong = new LatLng(6.12439835, 100.36756271297492);
    const radiusMeters = 10000;

    // Create the map
    const map = L.map('map', {zoomControl: false}).setView(latlong, 12);

    // Set up the OSM layer
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ).addTo(map);

    // origin marker
    const myIcon = L.icon({
      iconUrl: 'https://cdn3.iconfinder.com/data/icons/tango-icon-library/48/go-home-512.png',
      iconSize: [32, 32],
      iconAnchor: [32, 32],
      popupAnchor: [-3, -76],
    });
    const originMarker = L.marker(latlong, {
      title: 'origin',
      icon: myIcon,
      draggable: true
    }).addTo(map);
    originMarker.on('drag', (event) => {
      const marker = event.target;
      const position = marker.getLatLng();
      radiusMarker.setLatLng(new L.LatLng(position.lat, position.lng));
      //map.panTo(new L.LatLng(position.lat, position.lng))
    });

    // destination marker
    const destIcon = L.icon({
      iconUrl: 'https://cdn2.iconfinder.com/data/icons/ios-7-icons/50/finish_flag-512.png',
      iconSize: [32, 32],
      iconAnchor: [32, 32],
      popupAnchor: [-3, -76],
    });
    L.marker(destLatLong, {
      title: 'Menara Alor Setar, Jalan Istana Kuning, Taman Stadium, Kampung Khatijah, Alor Setar, Kota Setar, Kedah, 05100, Malaysia',
      icon: destIcon
    }).addTo(map);

    // Radius
    const radiusMarker = L.circle(latlong, {
      radius: radiusMeters
    }).addTo(map);
  }

}
