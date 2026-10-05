'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

type Coordinates = { lat: number; lng: number }
type MapClick = { latLng: { lat(): number; lng(): number } | null }
type MapInstance = {
  addListener(eventName: string, callback: (event: MapClick) => void): void
  setCenter(position: Coordinates): void
  setZoom(zoom: number): void
}
type MarkerInstance = {
  setPosition(position: Coordinates): void
  setMap(map: MapInstance | null): void
  addListener(eventName: string, callback: () => void): void
}
type InfoWindowInstance = {
  setContent(content: HTMLElement): void
  open(options: { map: MapInstance; anchor: MarkerInstance }): void
}
type MapsLibrary = {
  Map: new (element: HTMLElement, options: { center: Coordinates; zoom: number; streetViewControl: boolean; mapTypeControl: boolean }) => MapInstance
  InfoWindow: new () => InfoWindowInstance
}
type MarkerLibrary = {
  Marker: new (options: { map: MapInstance; position: Coordinates; title?: string }) => MarkerInstance
}
type MapsApi = {
  maps: {
    Map?: MapsLibrary['Map']
    Marker?: MarkerLibrary['Marker']
    InfoWindow?: MapsLibrary['InfoWindow']
  }
}
export type GoogleMapMarker = { id: string; title: string; position: Coordinates; href: string }

declare global {
  interface Window {
    google?: MapsApi
  }
}

export default function GoogleMapLocationPicker({
  value,
  onChange,
  markers = [],
}: {
  value: Coordinates | null
  onChange?: (coordinates: Coordinates) => void
  markers?: GoogleMapMarker[]
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapElement = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<MapInstance | null>(null)
  const selectedMarker = useRef<MarkerInstance | null>(null)
  const minyanMarkers = useRef<MarkerInstance[]>([])
  const infoWindow = useRef<InfoWindowInstance | null>(null)
  const [mapsLibrary, setMapsLibrary] = useState<MapsLibrary | null>(null)
  const [markerLibrary, setMarkerLibrary] = useState<MarkerLibrary | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!loaded || !window.google?.maps.Map || !window.google.maps.Marker || !window.google.maps.InfoWindow) {
      if (loaded) setLoadFailed(true)
      return
    }
    setMapsLibrary({ Map: window.google.maps.Map, InfoWindow: window.google.maps.InfoWindow })
    setMarkerLibrary({ Marker: window.google.maps.Marker })
  }, [loaded])

  useEffect(() => {
    if (!mapsLibrary || !mapElement.current || mapInstance.current) return

    const map = new mapsLibrary.Map(mapElement.current, {
      center: value ?? { lat: 20, lng: 0 },
      zoom: value ? 13 : 2,
      streetViewControl: false,
      mapTypeControl: false,
    })
    mapInstance.current = map
    infoWindow.current = new mapsLibrary.InfoWindow()
    map.addListener('click', (event) => {
      if (!event.latLng || !onChange) return
      const coordinates = { lat: event.latLng.lat(), lng: event.latLng.lng() }
      if (selectedMarker.current) selectedMarker.current.setPosition(coordinates)
      else if (markerLibrary) selectedMarker.current = new markerLibrary.Marker({ map, position: coordinates, title: 'New minyan location' })
      onChange(coordinates)
    })
  }, [mapsLibrary, markerLibrary, onChange, value])

  useEffect(() => {
    if (!value || !mapInstance.current || !markerLibrary) return
    mapInstance.current.setCenter(value)
    mapInstance.current.setZoom(14)
    if (selectedMarker.current) selectedMarker.current.setPosition(value)
    else selectedMarker.current = new markerLibrary.Marker({ map: mapInstance.current, position: value, title: 'New minyan location' })
  }, [markerLibrary, value])

  useEffect(() => {
    if (!mapInstance.current || !markerLibrary) return
    minyanMarkers.current.forEach((marker) => marker.setMap(null))
    minyanMarkers.current = markers.map((minyan) => {
      const marker = new markerLibrary.Marker({ map: mapInstance.current!, position: minyan.position, title: minyan.title })
      marker.addListener('click', () => {
        const content = document.createElement('div')
        const title = document.createElement('strong')
        title.textContent = minyan.title
        const link = document.createElement('a')
        link.href = minyan.href
        link.textContent = 'View minyan details'
        link.style.display = 'block'
        link.style.marginTop = '6px'
        content.append(title, link)
        infoWindow.current?.setContent(content)
        infoWindow.current?.open({ map: mapInstance.current!, anchor: marker })
      })
      return marker
    })
  }, [markers, markerLibrary])

  if (!apiKey) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#dfe5e0] bg-[#f7f7f2] p-4 text-sm text-[#718489]">
        <MapPin size={18} className="mt-0.5 shrink-0 text-[#d57561]" />
        <p>Google Maps is not configured yet. Enter coordinates below; map selection will be available once the Maps API key is set.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-xs text-[#718489]">Click the map to pin the exact meeting point.</p>
      <div ref={mapElement} className="h-64 overflow-hidden rounded-xl border border-[#dfe5e0] bg-[#edf3ef]" aria-label="Select minyan location on map" />
      {!mapsLibrary && !loadFailed && <p className="mt-2 text-xs text-[#718489]">Loading map…</p>}
      {loadFailed && <p role="alert" className="mt-2 text-xs text-[#a94f40]">The map could not load. Enter coordinates manually below.</p>}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=maps,marker`}
        strategy="afterInteractive"
        onReady={() => setLoaded(true)}
        onError={() => setLoadFailed(true)}
      />
    </div>
  )
}