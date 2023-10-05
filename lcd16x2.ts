
//% color=#001FCF icon="\uf26c" block="LCD 16x2" weight=18
namespace lcd16x2rgb
/* 230814
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
    export enum eADDR_LCD { LCD_16x2 = 0x3E /*, LCD_16x2_V4 = 0x70, 0x27 */ }

    // Code LCD 16x2 ======================================

    // ========== group="LCD 16x2 Display"

    //% group="LCD 16x2 Display"
    //% block="i2c %pADDR beim Start" weight=6
    //% pADDR.shadow="lcd16x2_eADDR"
    export function initLCD(pADDR: number) {
        control.waitMicros(30000)
        write0x80Byte(pADDR, 0x38) // Function Set DL N
        control.waitMicros(50)
        write0x80Byte(pADDR, 0x0C) // Display ON, Cursor OFF
        control.waitMicros(50)
        write0x80Byte(pADDR, 0x01) // Screen Clear
        control.waitMicros(1600)
        write0x80Byte(pADDR, 0x06) // Increment Mode
    }

    //% group="LCD 16x2 Display"
    //% block="i2c %pADDR Display löschen" weight=2
    //% pADDR.shadow="lcd16x2_eADDR"
    export function clearScreen(pADDR: number) {
        write0x80Byte(pADDR, 0x01)
        control.waitMicros(1600)
    }


    // ========== group="Text anzeigen"

    export enum eAlign {
        //% block="linksbündig"
        left,
        //% block="rechtsbündig"
        right
    }

    //% group="Text anzeigen"
    //% block="i2c %pADDR Text Zeile %row von %col bis %end %pText || %pAlign" weight=7
    //% pADDR.shadow="lcd16x2_eADDR"
    //% row.min=0 row.max=1 col.min=0 col.max=15 end.min=0 end.max=15 end.defl=15
    //% pText.shadow="lcd16x2_text"
    //% pAlign.defl=0
    //% inlineInputMode=inline
    export function writeText(pADDR: number, row: number, col: number, end: number, pText: any, pAlign?: eAlign) {
        let text: string = convertToText(pText)
        let len: number = end - col + 1
        //if (col >= 0 && col <= 15 && len > 0 && len <= 16) 
        if (between(row, 0, 1) && between(col, 0, 15) && between(len, 0, 16)) {
            setCursor(pADDR, row, col)

            if (text.length > len)
                text = text.substr(0, len)
            else if (text.length < len && pAlign == eAlign.right)
                text = "                ".substr(0, len - text.length) + text
            else if (text.length < len)
                text = text + "                ".substr(0, len - text.length)
            // else { } // Original Text text.length == len

            writeLCD(pADDR, text)
        }
    }

    //% group="Text anzeigen"
    //% block="i2c %pADDR Cursor Zeile %row von %col" weight=6
    //% pADDR.shadow="lcd16x2_eADDR"
    //% row.min=0 row.max=1 col.min=0 col.max=15
    export function setCursor(pADDR: number, row: number, col: number) {
        if (between(row, 0, 1) && between(col, 0, 15)) {

            write0x80Byte(pADDR, (row == 0 ? col | 0x80 : col | 0xc0))
            control.waitMicros(50)
        }
    }

    //% group="Text anzeigen"
    //% block="i2c %pADDR Text %pText" weight=4
    //% pADDR.shadow="lcd16x2_eADDR"
    //% pText.shadow="lcd16x2_text"
    export function writeLCD(pADDR: number, pText: any) {
        let text: string = convertToText(pText)
        let b = Buffer.create(text.length + 1)
        b.setUint8(0, 0x40)
        for (let i = 0; i <= text.length - 1; i++) {
            b.setUint8(i + 1, changeCharCode(text.charAt(i)))
        }
        lcd16x2_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, b)
        control.waitMicros(50)
    }


    // ========== group="Display"

    //% group="Display"
    //% block="i2c %pADDR Cursor Zeile %row von %col Cursor %cursor || Blink %blink" weight=4
    //% pADDR.shadow="lcd16x2_eADDR"
    //% row.min=0 row.max=1 col.min=0 col.max=15 cursor.defl=true blink.defl=false
    //% cursor.shadow="toggleOnOff" blink.shadow="toggleOnOff"
    //% inlineInputMode=inline
    export function setCursorCB(pADDR: number, row: number, col: number, cursor: boolean, blink?: boolean) {
        setCursor(pADDR, row, col)
        setDisplay(pADDR, true, cursor, blink)
    }

    //% group="Display"
    //% block="i2c %pADDR Display %display Cursor %cursor || Blink %blink" weight=2
    //% pADDR.shadow="lcd16x2_eADDR"
    //% display.defl=true blink.defl=false
    //% display.shadow="toggleOnOff" cursor.shadow="toggleOnOff" blink.shadow="toggleOnOff"
    //% inlineInputMode=inline
    export function setDisplay(pADDR: number, display: boolean, cursor: boolean, blink?: boolean) {
        let command: number = 0x08 // Command DISPLAY SWITCH
        if (display) { command += 0x04 } // D
        if (cursor) { command += 0x02 } // C
        if (blink) { command += 0x01 } // B

        write0x80Byte(pADDR, command)
        control.waitMicros(50)
    }
    /* 
        //% group="LCD"
        //% block="i2c %pADDR Display löschen" weight=1
        //% pADDR.shadow="lcd16x2_eADDR"
         function screenClear(pADDR: number) {
            write0x80Byte(pADDR, 0x01)
            control.waitMicros(1600)
        }
     */

    // ========== group="Text, Logik" advanced=true

    //% group="Text, Logik" advanced=true
    //% blockId=lcd16x2_text block="%s" weight=6
    export function lcd16x2_text(s: string): string { return s }


    //% group="Text, Logik" advanced=true
    //% block="Sonderzeichen Code von Char %pChar" weight=4
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
        return pChar.charCodeAt(0) & 0xFF // es können nur 1 Byte Zeichen-Codes im Buffer übertragen werden
    }


    // ========== group="Logik"

    //% group="Text, Logik" advanced=true
    //% block="%i0 zwischen %i1 und %i2" weight=2
    export function between(i0: number, i1: number, i2: number): boolean {
        return (i0 >= i1 && i0 <= i2)
    }

    // ========== group="i2c Adressen"

    //% blockId=lcd16x2_eADDR
    //% group="i2c Adressen" advanced=true
    //% block="%pADDR" weight=4
    export function lcd16x2_eADDR(pADDR: eADDR_LCD): number { return pADDR }

    //% group="i2c Adressen" advanced=true
    //% block="Fehlercode vom letzten WriteBuffer [LCD] (0 ist kein Fehler)" weight=2
    export function i2cError_LCD() { return lcd16x2_i2cWriteBufferError }
    let lcd16x2_i2cWriteBufferError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)

    // ========== PRIVATE function command nur für LCD (nicht für RGB)

    function write0x80Byte(pADDR: number, b1: number) {
        let b = pins.createBuffer(2)
        b.setUint8(0, 0x80)
        b.setUint8(1, b1)
        lcd16x2_i2cWriteBufferError = pins.i2cWriteBuffer(pADDR, b)
    }
} // lcd16x2.ts

