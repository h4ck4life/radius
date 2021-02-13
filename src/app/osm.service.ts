import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OsmService {
  constructor(private http: HttpClient) { }

  searchPlace(placeName: string): any {
    if (placeName) {
      return this.http.get(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${placeName}`);
    }
  }

}
