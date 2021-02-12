import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { LatLng } from 'leaflet';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
  ) { }

  selectedMap = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  tileLayer: L.TileLayer = L.tileLayer(this.selectedMap, { crossOrigin: true });
  radiusMeters = 10000;
  latlong = new LatLng(3.1420, 101.6918); // National Mosque
  // destLatLong = new LatLng(6.12439835, 100.36756271297492);
  map: L.Map = null;
  radiusMarker: L.Circle = null;
  myIcon: L.Icon = null;
  originMarker: L.Marker = null;
  zoomLevel = 12;

  ngOnInit(): void {
    try {
      this.route.params.subscribe((params) => {
        if (!isNaN(params.lat)
          && !isNaN(params.lng)
          && !isNaN(params.radius)
        ) {
          this.latlong.lat = parseFloat(params.lat);
          this.latlong.lng = parseFloat(params.lng);
          this.radiusMeters = params.radius * 1000;
        } else {
          this.router.navigateByUrl('');
        }
        this.initMap();
      });
    } catch (error) {
      this.router.navigateByUrl('');
    }
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
      // tslint:disable-next-line: radix
      const radius = parseInt(radiusKm);
      if (radius > 4) {
        const updatedRadius = radius * 1000;
        this.radiusMarker.setRadius(updatedRadius);
        this.radiusMeters = updatedRadius;
        this.updateUrlParams();
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
      this.updateUrlParams(data.lat, data.lng);
    });
  }

  private updateUrlParams(lat = this.latlong.lat, lng = this.latlong.lng): void {
    this.location.replaceState(`/${lat.toFixed(4)}/${lng.toFixed(4)}/${this.radiusMeters / 1000}`);
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

    this.map = L.map('map', { zoomControl: false }).setView(this.latlong, this.zoomLevel);

    this.tileLayer.addTo(this.map);

    L.control.scale({ metric: true, imperial: false }).addTo(this.map);
    L.control.attribution({ prefix: '@h4ck4life' }).addAttribution('#StaySafe').addTo(this.map);

    this.myIcon = L.icon({
      iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
      iconSize: [48, 48]
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
      this.updateUrlParams(position.lat, position.lng);
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

    this.radiusMarker = L.circle(this.latlong, {
      radius: this.radiusMeters
    }).addTo(this.map);
  }
}
