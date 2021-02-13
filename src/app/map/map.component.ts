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
  tileLayer: L.TileLayer = L.tileLayer(this.selectedMap, { crossOrigin: true, attribution: '@h4ck4life' });
  radiusMeters = 10000;
  latlong = new LatLng(3.1420, 101.6918); // National Mosque
  // destLatLong = new LatLng(6.12439835, 100.36756271297492);
  map: L.Map = null;
  radiusMarker: L.Circle = null;
  myIcon: L.Icon = null;
  originMarker: L.Marker = null;
  zoomLevel = 12;
  trackMe = false;
  watchId = 0;
  trackMeMarker: L.Marker = null;
  positionOptions = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 60000
  };
  wakeLock = null;

  ngOnInit(): void {
    try {
      this.route.params.subscribe((params) => {
        if (!isNaN(params.lat)
          && !isNaN(params.lng)
          && !isNaN(params.radius)
          && !isNaN(params.zoom)
        ) {
          this.latlong.lat = parseFloat(params.lat);
          this.latlong.lng = parseFloat(params.lng);
          this.radiusMeters = params.radius * 1000;
          this.zoomLevel = params.zoom;
        } else {
          this.router.navigateByUrl('');
        }
        document.addEventListener('visibilitychange', async () => {
          let nav: any;
          nav = navigator;
          if (this.trackMe === true) {
            if (this.wakeLock !== null && document.visibilityState === 'visible') {
              this.wakeLock = await nav.wakeLock.request('screen');
            }
          }
        });
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
      case '6':
        this.selectedMap = 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png';
        break;
      case '7':
        this.selectedMap = 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}';
        break;
      case '8':
        this.selectedMap = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
        break;
      case '9':
        this.selectedMap = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        break;
      case '10':
        this.selectedMap = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        break;
      case '11':
        this.selectedMap = 'https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png';
        break;
    }
    this.tileLayer.setUrl(this.selectedMap);
  }

  setRadiusMarker(radiusKm: string): void {
    if (radiusKm && radiusKm !== '') {
      // tslint:disable-next-line: radix
      const radius = parseInt(radiusKm);
      if (radius > 0 && radius <= 50) {
        const updatedRadius = radius * 1000;
        this.radiusMarker.setRadius(updatedRadius);
        this.radiusMeters = updatedRadius;
        this.updateUrlParams();
      }
    }
  }

  trackMyLocation(): void {
    if (this.trackMe === true) {
      this.trackMe = false;

      navigator.geolocation.clearWatch(this.watchId);
      this.map.removeLayer(this.trackMeMarker);
      this.radiusMarker.setStyle({
        color: 'rgb(51, 136, 255)'
      });

      L.DomUtil.removeClass(document.getElementById('logo'), 'trackMeActive');
      L.DomUtil.removeClass(document.getElementById('logo'), 'blink-image');

      this.wakeLock.release()
        .then(() => {
          this.wakeLock = null;
        });

    } else {
      this.trackMe = true;
      const destIcon = L.icon({
        iconUrl: 'https://cdn3.iconfinder.com/data/icons/business-and-office-51/32/rocket_science_spaceship_technology-512.png',
        iconSize: [32, 32],
        shadowSize: [32, 32],
        className: 'blink-image'
      });

      this.trackMeMarker = L.marker(new LatLng(0, 0), {
        icon: destIcon,
      }).addTo(this.map);

      this.trackMeMarker.bindTooltip('You (live tracking)', { offset: new L.Point(20, 0) }).openTooltip();

      this.setScreenWakeLock();

      this.watchId = navigator.geolocation.watchPosition((position) => {
        const ll = new LatLng(position.coords.latitude, position.coords.longitude);
        this.checkUserIsInRadiusCircle(ll);
        this.trackMeMarker.setLatLng(ll);
        this.map.flyTo(ll);
        L.DomUtil.addClass(document.getElementById('logo'), 'trackMeActive blink-image');

      }, (error) => {
        console.log(error);
      }, this.positionOptions);
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

  private async setScreenWakeLock(): Promise<void> {
    let nav: any;
    nav = navigator;
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await nav.wakeLock.request('screen');
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log('WakeLock not supported');
    }
  }

  private checkUserIsInRadiusCircle(latlng: LatLng): void {
    const d = this.map.distance(latlng, this.radiusMarker.getLatLng());
    const isInside = d < this.radiusMarker.getRadius();
    this.radiusMarker.setStyle({
      color: isInside ? 'green' : 'red'
    });
  }

  private updateUrlParams(lat = this.latlong.lat, lng = this.latlong.lng): void {
    this.location.replaceState(`/${lat.toFixed(4)}/${lng.toFixed(4)}/${this.radiusMeters / 1000}/${this.map.getZoom()}`);
  }

  private getPosition(): Promise<any> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition((resp) => {
        resolve({
          lng: resp.coords.longitude,
          lat: resp.coords.latitude
        });
      }, (err) => {
        reject(err);
      }, this.positionOptions);
    });
  }

  private initMap(): void {
    this.getMapStyles();
    // tslint:disable-next-line: max-line-length
    this.map = L.map('map', {
      zoomControl: false,
      bounceAtZoomLimits: true,
      markerZoomAnimation: true,
      minZoom: 10,
      attributionControl: false
    }).setView(this.latlong, this.zoomLevel);

    L.control.zoom({
      position: 'bottomleft'
    }).addTo(this.map);

    this.map.on('zoomend', () => {
      this.updateUrlParams();
    });

    this.tileLayer.addTo(this.map);

    L.control
      .scale({ metric: true, imperial: false })
      .addTo(this.map);

    this.myIcon = L.icon({
      iconUrl: 'https://cdn3.iconfinder.com/data/icons/business-and-office-51/32/office_business_building_corporate-512.png',
      iconSize: [48, 48]
    });

    this.originMarker = L.marker(this.latlong, {
      // title: 'Center',
      icon: this.myIcon,
      draggable: true,
      riseOnHover: true
    }).addTo(this.map);

    this.originMarker.bindTooltip('Origin location', { offset: new L.Point(25, 0) }).openTooltip();
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
