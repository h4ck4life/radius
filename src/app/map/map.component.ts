import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import * as _ from 'lodash';
import { LatLng } from 'leaflet';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { OsmService } from '../osm.service';

declare var $: any;

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
    private osm: OsmService
  ) { }

  selectedMap = '1';
  tileLayer: L.TileLayer = L.tileLayer(
    this.selectedMap,
    {
      crossOrigin: true,
      attribution: '@h4ck4life'
    });
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
  searchTypeTimeout = null;
  placesList = [];

  ngOnInit(): void {
    try {
      this.route.params.subscribe((params) => {
        if (!isNaN(params.lat)
          && !isNaN(params.lng)
          && !isNaN(params.radius)
          && !isNaN(params.zoom)
          && params.mapstyle
        ) {
          this.latlong.lat = parseFloat(params.lat);
          this.latlong.lng = parseFloat(params.lng);
          this.radiusMeters = params.radius * 1000;
          this.zoomLevel = params.zoom;
          this.selectedMap = params.mapstyle;
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

  getMapStyles(style: string = this.selectedMap): void {
    let styleUrl = '';
    switch (style) {
      case '1':
        this.selectedMap = '1';
        styleUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        break;
      case '2':
        this.selectedMap = '2';
        styleUrl = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
        break;
      case '3':
        this.selectedMap = '3';
        styleUrl = 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
        break;
      case '4':
        this.selectedMap = '4';
        styleUrl = 'http://tile.stamen.com/toner/{z}/{x}/{y}.png';
        break;
      case '5':
        this.selectedMap = '5';
        styleUrl = 'http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
        break;
      case '6':
        this.selectedMap = '6';
        styleUrl = 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png';
        break;
      case '7':
        this.selectedMap = '7';
        styleUrl = 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}';
        break;
      case '8':
        this.selectedMap = '8';
        styleUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
        break;
      case '9':
        this.selectedMap = '9';
        styleUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        break;
      case '10':
        this.selectedMap = '10';
        styleUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        break;
      case '11':
        this.selectedMap = '11';
        styleUrl = 'https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png';
        break;
    }
    this.tileLayer.setUrl(styleUrl);
    this.updateUrlParams();
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
      const destIcon = this.generatePulsatingMarker(12, '#17a2b8');
      this.trackMeMarker = L.marker(new LatLng(0, 0), {
        icon: destIcon,
      }).addTo(this.map);

      const group = L.featureGroup([this.trackMeMarker, this.originMarker]);
      this.trackMeMarker.bindTooltip('You (live tracking)', { offset: new L.Point(20, 0) }).openTooltip();

      this.setScreenWakeLock();

      this.watchId = navigator.geolocation.watchPosition((position) => {
        const ll = new LatLng(position.coords.latitude, position.coords.longitude);
        this.checkUserIsInRadiusCircle(ll);
        this.trackMeMarker.setLatLng(ll);
        this.map.flyTo(ll);
        //this.map.fitBounds(group.getBounds(), { animate: true });
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

  clearSearchInput(): void {
    $('#originInput').val('');
  }

  searchPlaces(placeName: string): void {
    const self = this;
    $('#originInput').autocomplete({
      minLength: 3,
      source(request, response): void {
        $.get(`https://nominatim.openstreetmap.org/search/${placeName.trim()}?limit=5&format=json&addressdetails=1`, (data) => {
          const filteredData = _.map(data, (object) => {
            const placeValue = object.display_name.split(',')[0];
            const placeCity = object.address.city || object.display_name.split(',')[1];
            object.label = object.display_name;
            object.value = `${placeValue}, ${placeCity}`;
            return _.pick(object, ['display_name', 'lat', 'lon', 'label', 'value']);
          });
          response(filteredData);
        });
      },
      select(event, ui): void {
        self.latlong.lat = parseFloat(ui.item.lat);
        self.latlong.lng = parseFloat(ui.item.lon);
        self.map.panTo(self.latlong);
        self.originMarker.setLatLng(self.latlong);
        self.radiusMarker.setLatLng(self.latlong);
        self.updateUrlParams(parseFloat(ui.item.lat), parseFloat(ui.item.lon));
      },
      open(): void {
        $('ul.ui-menu').width($(this).innerWidth());
      }
    });
  }

  private generatePulsatingMarker(radius, color): L.DivIcon {
    const cssStyle = `
      width: ${radius}px;
      height: ${radius}px;
      background: ${color};
      color: ${color};
      box-shadow: 0 0 0 ${color};
    `;
    return L.divIcon({
      html: `<span style="${cssStyle}" class="pulse"/>`,
      className: ''
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
    this.location.replaceState(
      `/${lat.toFixed(4)}/${lng.toFixed(4)}/${this.radiusMeters / 1000}/${this.map.getZoom()}/${this.selectedMap}`
    );
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

    // tslint:disable-next-line: max-line-length
    this.map = L.map('map', {
      zoomControl: false,
      // bounceAtZoomLimits: true,
      markerZoomAnimation: true,
      minZoom: 10,
      attributionControl: false
    }).setView(this.latlong, this.zoomLevel);

    this.getMapStyles();

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

    this.radiusMarker = L.circle(this.latlong, {
      radius: this.radiusMeters
    }).setStyle({
      stroke: false
    }).addTo(this.map);
  }
}
