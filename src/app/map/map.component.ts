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

  selectedMap = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  tileLayer: L.TileLayer = L.tileLayer(this.selectedMap, { crossOrigin: true });
  radiusMeters = 10000;
  latlong = new LatLng(3.1420, 101.6918);
  // destLatLong = new LatLng(6.12439835, 100.36756271297492);
  map: L.Map = null;
  radiusMarker: L.Circle = null;
  myIcon: L.Icon = null;
  originMarker: L.Marker = null;

  ngOnInit(): void {
    this.initMap();
  }

  getMapStyles(style: string = '1'): void {
    switch (style) {
      case '1':
        this.selectedMap = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        break;
      case '2':
        this.selectedMap = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
        break;
      case '3':
        this.selectedMap = 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
        break;
      case '4':
        this.selectedMap = 'http://tile.stamen.com/toner/{z}/{x}/{y}.png';
        break;
      case '5':
        this.selectedMap = 'http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
        break;
    }
    this.tileLayer.setUrl(this.selectedMap);
  }

  setRadiusMarker(radiusKm: string): void {
    if (radiusKm && radiusKm !== '') {
      const radius = parseInt(radiusKm, 8);
      if (radius > 4) {
        this.radiusMarker.setRadius(radius * 1000);
      }
    }
  }

  getUserLocation(): void {
    this.getPosition().then((data) => {
      this.latlong.lat = data.lat;
      this.latlong.lng = data.lng;
      this.map.panTo(this.latlong);
      this.originMarker.setLatLng(this.latlong);
      this.radiusMarker.setLatLng(this.latlong);
    });
  }

  private getPosition(): Promise<any> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resp => {
        resolve({ lng: resp.coords.longitude, lat: resp.coords.latitude });
      },
        err => {
          reject(err);
        });
    });
  }

  private initMap(): void {

    this.getMapStyles();

    // Create the map
    this.map = L.map('map', { zoomControl: false }).setView(this.latlong, 12);

    // Set up the OSM layer
    this.tileLayer.addTo(this.map);

    // Set scale to map
    L.control.scale({ metric: true, imperial: false }).addTo(this.map);

    // Add attribution note
    L.control.attribution({ prefix: '@h4ck4life' }).addAttribution('#KitaJagaKita').addTo(this.map);

    // origin marker
    this.myIcon = L.icon({
      iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
      iconSize: [48, 48],
      //iconAnchor: [32, 32],
      //popupAnchor: [-3, -76],
    });
    this.originMarker = L.marker(this.latlong, {
      title: 'Your location',
      icon: this.myIcon,
      draggable: true
    }).addTo(this.map);
    this.originMarker.on('drag', (event) => {
      const marker = event.target;
      const position = marker.getLatLng();
      this.radiusMarker.setLatLng(new L.LatLng(position.lat, position.lng));
    });
    this.originMarker.on('dragend', (event) => {
      const marker = event.target;
      const position = marker.getLatLng();
      this.map.panTo(new L.LatLng(position.lat, position.lng));
    });

    // destination marker
    /* 
    const destIcon = L.icon({
      iconUrl: 'https://cdn2.iconfinder.com/data/icons/ios-7-icons/50/finish_flag-512.png',
      iconSize: [32, 32],
      iconAnchor: [32, 32],
      popupAnchor: [-3, -76],
    });
    L.marker(this.destLatLong, {
      title: 'Menara Alor Setar, Jalan Istana Kuning, Taman Stadium, Kampung Khatijah, Alor Setar, Kota Setar, Kedah, 05100, Malaysia',
      icon: destIcon
    }).addTo(this.map);
     */

    // Radius
    this.radiusMarker = L.circle(this.latlong, {
      radius: this.radiusMeters
    }).addTo(this.map);
  }

}
