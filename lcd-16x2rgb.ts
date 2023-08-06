
//% color=#003F7F icon="\uf108" block="LCD 16x2" weight=18
namespace lcd16x2rgb
/* 230806
Calliope i2c Erweiterung für 'Grove - 16x2 LCD' und 'Grove - LCD RGB Backlight'
optimiert und getestet für die gleichzeitige Nutzung mehrerer i2c Module am Calliope
[Projekt-URL] https://github.com/calliope-net/lcd-16x2rgb
[README]      https://calliope-net.github.io/lcd-16x2rgb

[Hardware] https://wiki.seeedstudio.com/Grove-16x2_LCD_Series
[PDF] JDH_1804_Datasheet https://files.seeedstudio.com/wiki/Grove-16x2_LCD_Series/res/JDH_1804_Datasheet.pdf

https://wiki.seeedstudio.com/Grove-LCD_RGB_Backlight/#resources
LCD 16x2 [Datasheet] JHD1313 https://files.seeedstudio.com/wiki/Grove_LCD_RGB_Backlight/res/JHD1313%20FP-RGB-1%201.4.pdf
RGB <  V5 [Datasheet] PCA9633 https://files.seeedstudio.com/wiki/Grove_LCD_RGB_Backlight/res/PCA9633.pdf
RGB ab V5 [Datasheet] fehlt
[Library] Software Library https://github.com/Seeed-Studio/Grove_LCD_RGB_Backlight/archive/master.zip

Text anzeigen (16x2 LCD) funktioniert bei allen (seeedstudio) Modulen, allen Versionen mit und ohne Backlight
das Datasheet JHD1804 und JHD1313 gilt nur für LCD, also zum Text anzeigen
diese sind für Module mit und ohne Backlight scheinbar identisch
(allerdings funktioniert bei einem vorhandenen Modul 'Backlight V4.0' nur RGB<V5 (alt), Text wird nicht angezeigt)

die Module 'Grove-LCD RGB Backlight' haben ab V5.0 einen anderen Chip für RGB, andere Adresse, anderen Code
die Beschreibung auf der seeedstudio Seite passt nicht zu Modulen ab V5.0
das Datasheet PCA9633 gilt nur für RGB < V5 und ist ab V5 nicht zu gebrauchen
der Code für V5 stammt aus der Datei rgb_lcd.cpp in der [Software Library] (Link zur master.zip-Datei oben)
initRGB ab Zeile 116; setRGB ab Zeile 298

Code anhand der original Datenblätter neu programmiert von Lutz Elßner im Juli 2023
*/ {
    export enum eADDR_RGB { RGB_16x2_V5 = 0x30, RGB_16x2_x62 = 0x62 }
    export enum eADDR_LCD { LCD_16x2 = 0x3E /*, LCD_16x2_V4 = 0x70, 0x27 */ }

    // Code RGB Backlight ======================================

    // ========== group="RGB Backlight (nur Display mit Hintergrundfarbe)"

    //% group="RGB Backlight (nur Display mit Hintergrundfarbe)"
    //% block="i2c %i2cADDR init RGB" weight=92
    export function initRGB(pADDR: eADDR_RGB) {
        if (pADDR == eADDR_RGB.RGB_16x2_V5) {
            write2Byte(pADDR, 0x00, 0x07) // reset the chip
            control.waitMicros(200)             // wait 200 us to complete
            write2Byte(pADDR, 0x04, 0x15) // set all led always on
            control.waitMicros(200)
        } else {
            // backlight init
            write2Byte(pADDR, 0x00, 0x00) //setReg(REG_MODE1, 0);
            // set LEDs controllable by both PWM and GRPPWM registers
            write2Byte(pADDR, 0x08, 0xFF) //setReg(REG_OUTPUT, 0xFF);
            // set MODE2 values
            // 0010 0000 -> 0x20  (DMBLNK to 1, ie blinky mode)
            write2Byte(pADDR, 0x01, 0x20) //setReg(REG_MODE2, 0x20);
        }
    }

    //% group="RGB Backlight (nur Display mit Hintergrundfarbe)"
    //% block="i2c %i2cADDR set RGB r %r g %g b %b" weight=90
    //% r.min=0 r.max=255 g.min=0 g.max=255 b.min=0 b.max=255
    //% inlineInputMode=inline
    export function setRGB(pADDR: eADDR_RGB, r: number, g: number, b: number) {
        if (pADDR == eADDR_RGB.RGB_16x2_V5) {
            write2Byte(pADDR, 6, r)
            write2Byte(pADDR, 7, g)
            write2Byte(pADDR, 8, b)
        } else {
            write2Byte(pADDR, 4, r)
            write2Byte(pADDR, 3, g)
            write2Byte(pADDR, 2, b)
        }
    }

    // ========== PRIVATE function RGB

    function write2Byte(pADDR: eADDR_RGB, command: number, b1: number) {
        let b = pins.createBuffer(2)
        b.setUint8(0, command)
        b.setUint8(1, b1)
        pins.i2cWriteBuffer(pADDR, b)
    }



    // Code LCD 16x2 ======================================

    // ========== group="LCD 16x2 Display"

    //% group="LCD 16x2 Display"
    //% block="i2c %pADDR init LCD"  weight=86
    export function initLCD(pADDR: eADDR_LCD) {
        control.waitMicros(30000)
        write0x80Byte(pADDR, 0x38) // Function Set DL N
        control.waitMicros(50)
        write0x80Byte(pADDR, 0x0C) // Display ON, Cursor OFF
        control.waitMicros(50)
        write0x80Byte(pADDR, 0x01) // Screen Clear
        control.waitMicros(1600)
        write0x80Byte(pADDR, 0x06) // Increment Mode
    }

    export enum eAlign { left, right }

    //% group="LCD 16x2 Display"
    //% block="i2c %pADDR writeText row %row col %col end %end align %pFormat Text %pText" weight=84
    //% row.min=0 row.max=1 col.min=0 col.max=15 end.min=0 end.max=15 end.defl=15
    //% inlineInputMode=inline
    export function writeText(pADDR: eADDR_LCD, row: number, col: number, end: number, pAlign: eAlign, pText: string) {
        let l: number = end - col + 1, t: string
        if (col >= 0 && col <= 15 && l > 0 && l <= 16) {
            setCursor(pADDR, row, col)

            if (pText.length >= l) t = pText.substr(0, l)
            else if (pText.length < l && pAlign == eAlign.left) { t = pText + "                ".substr(0, l - pText.length) }
            else if (pText.length < l && pAlign == eAlign.right) { t = "                ".substr(0, l - pText.length) + pText }

            writeLCD(pADDR, t)
        }
    }

    //% group="LCD 16x2 Display"
    //% block="i2c %pADDR setCursor row %row col %col" weight=82
    //% row.min=0 row.max=1 col.min=0 col.max=15
    export function setCursor(pADDR: eADDR_LCD, row: number, col: number) {
        write0x80Byte(pADDR, (row == 0 ? col | 0x80 : col | 0xc0))
        control.waitMicros(50)
    }

    //% group="LCD 16x2 Display"
    //% block="i2c %pADDR writeText %pText" weight=80
    export function writeLCD(pADDR: eADDR_LCD, pText: string) {
        let b = pins.createBuffer(pText.length + 1)
        b.setUint8(0, 0x40)
        for (let Index = 0; Index <= pText.length - 1; Index++) {
            b.setUint8(Index + 1, changeCharCode(pText.charAt(Index)))
            //b.setUint8(Index + 1, umlaut(pText.charCodeAt(Index)))
        }
        pins.i2cWriteBuffer(pADDR, b)
        control.waitMicros(50)
    }


    // ========== group="LCD" advanced=true

    export enum eONOFF { OFF = 0, ON = 1 }

    //% group="LCD" advanced=true
    //% block="i2c %pADDR setCursor row %row col %col cursor %cursor blink %blink" weight=54
    //% row.min=0 row.max=1 col.min=0 col.max=15 cursor.defl=lcd16x2rgb.eONOFF.ON
    //% inlineInputMode=inline
    export function setCursorCB(pADDR: eADDR_LCD, row: number, col: number, cursor: eONOFF, blink: eONOFF) {
        setCursor(pADDR, row, col)
        setDisplay(pADDR, eONOFF.ON, cursor, blink)
    }

    //% group="LCD" advanced=true
    //% block="i2c %pADDR display %display cursor %cursor blink %blink" weight=52
    //% row.min=0 row.max=1 col.min=0 col.max=15 display.defl=lcd16x2rgb.eONOFF.ON
    //% inlineInputMode=inline
    export function setDisplay(pADDR: eADDR_LCD, display: eONOFF, cursor: eONOFF, blink: eONOFF) {
        let command: number = 0x08 // Command DISPLAY SWITCH
        if (display == eONOFF.ON) { command += 0x04 } // D
        if (cursor == eONOFF.ON) { command += 0x02 } // C
        if (blink == eONOFF.ON) { command += 0x01 } // B

        write0x80Byte(pADDR, command)
        control.waitMicros(50)
    }

    //% group="LCD" advanced=true
    //% block="i2c %pADDR Display löschen" group="LCD" advanced=true weight=50
    export function screenClear(pADDR: eADDR_LCD/*clear: boolean, display: eONOFF, cursor: eONOFF, blink: eONOFF*/) {
        write0x80Byte(pADDR, 0x01)
        control.waitMicros(1600)
    }


    // ========== group="Text" advanced=true

    //% group="Text" advanced=true
    //% block="Sonderzeichen Code von Char %pChar" weight=40
    export function changeCharCode(pChar: string) {
        if (pChar.length == 0) return 0
        switch (pChar.charCodeAt(0)) {
            case 0x0D: return 0xA2 // CR durch druckbares Zeichen aus LCD Font-Table ersetzen
            case 0x0A: return 0xA3 // LF
            case 0xFF: return 0xF3 // EOF
            case 0x00: return 0xF2 // NUL
            case 0x80: return 0xE3 // € kann verschiedene Codierungen haben
        }
        switch (pChar.charAt(0)) { // case "ä", "Ä" mit Komma trennen funktioniert nicht
            case "ß": return 0xE2
            case "ä": return 0xE1
            case "ö": return 0xEF
            case "ü": return 0xF5
            case "Ä": return 0xE1
            case "Ö": return 0xEF
            case "Ü": return 0xF5
            case "€": return 0xE3 // € funktioniert nicht
            case "µ": return 0xE4
            case "°": return 0xDF
        }
        //if ("gjpqy".indexOf(pChar) > -1) return pChar.charCodeAt(0) | 0x80 // funktioniert, Zeichen unten abgeschnitten
        return pChar.charCodeAt(0) & 0xFF // es können nur 1 Byte Zeichen-Codes im Buffer übertragen werden
    }


    // ========== PRIVATE function command nur für LCD (nicht für RGB)

    function write0x80Byte(pADDR: eADDR_LCD, b1: number) {
        let b = pins.createBuffer(2)
        b.setUint8(0, 0x80)
        b.setUint8(1, b1)
        pins.i2cWriteBuffer(pADDR, b)
    }
} // lcd-16x2rgb.ts
