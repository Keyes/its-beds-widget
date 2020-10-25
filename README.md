# its-beds-widget

![Screenshot](screenshot.jpg "Screenshot")

This is a widget for [Scriptable](https://scriptable.app). To use this widget, add a new script to Scriptable, and insert this code:

```
// Licence: juliankern.com; CC BY 3.0 DE
(async () => new Function(await new Request('https://cdn.jsdelivr.net/gh/Keyes/its-beds-widget/widget.min.js').loadString())())();
```

This will load the current version, and keep it updated.

## Features
- Shows the situation of ITS beds in your current state (germany only), as well as in the whole country
- Add your state short code as parameter to change the displayed state (for short codes see below)
- Shows the timestamp of the last update - official updates happen usually once per hour 

### List of state short codes
- Baden-Württemberg: BW
- Bayern: BY
- Berlin: BE
- Brandenburg: BB
- Bremen: HB
- Hamburg: HH
- Hessen: HE
- Mecklenburg-Vorpommern: MV
- Niedersachsen: NI
- Nordrhein-Westfalen: NRW
- Rheinland-Pfalz: RP
- Saarland: SL
- Sachsen: SN
- Sachsen-Anhalt: ST
- Schleswig-Holstein: SH
- Thüringen: TH
