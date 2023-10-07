
namespace lcd16x2rgb
/*
*/ {
    export enum eADDR_RGB { RGB_16x2_V5 = 0x30, RGB_16x2_x62 = 0x62 }
    let n_i2cCheck: boolean = false // i2c-Check
    let n_i2cError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)


    // Code RGB Backlight ======================================

    // ========== group="RGB Backlight (nur Display mit Hintergrundfarbe)"

    //% group="RGB Backlight (nur Display mit Hintergrundfarbe)" subcategory="RGB Backlight"
    //% block="i2c %pADDR beim Start || i2c-Check %ck" weight=3
    //% pADDR.shadow="lcd16x2rgb_eADDR"
    //% ck.shadow="toggleOnOff" ck.defl=1
    export function initRGB(pADDR: number, ck?: boolean) {
        n_i2cCheck = (ck ? true : false) // optionaler boolean Parameter kann undefined sein
        n_i2cError = 0 // Reset Fehlercode

        if (pADDR == eADDR_RGB.RGB_16x2_V5) {
            write2Byte(pADDR, 0x00, 0x07) // reset the chip
            //if (i2cNoError(pADDR)) {
            control.waitMicros(200)             // wait 200 us to complete
            write2Byte(pADDR, 0x04, 0x15) // set all led always on
            control.waitMicros(200)
            //}
        } else {
            // backlight init
            write2Byte(pADDR, 0x00, 0x00) //setReg(REG_MODE1, 0);
            //if (n_i2cError != 0) {
            //    basic.showNumber(pADDR)
            //} else {
            // set LEDs controllable by both PWM and GRPPWM registers
            write2Byte(pADDR, 0x08, 0xFF) //setReg(REG_OUTPUT, 0xFF);
            // set MODE2 values
            // 0010 0000 -> 0x20  (DMBLNK to 1, ie blinky mode)
            write2Byte(pADDR, 0x01, 0x20) //setReg(REG_MODE2, 0x20);
            //}
        }
    }

    //% group="RGB Backlight (nur Display mit Hintergrundfarbe)" subcategory="RGB Backlight"
    //% block="i2c %pADDR set RGB rot %r grün %g blau %b" weight=2
    //% pADDR.shadow="lcd16x2rgb_eADDR"
    //% r.min=0 r.max=255 r.defl=255 g.min=0 g.max=255 g.defl=255 b.min=0 b.max=255 b.defl=255
    //% inlineInputMode=inline
    export function setRGB(pADDR: number, r: number, g: number, b: number) {
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

    //% group="RGB Backlight (nur Display mit Hintergrundfarbe)" subcategory="RGB Backlight"
    //% block="i2c %pADDR set RGB %color" weight=1
    //% pADDR.shadow="lcd16x2rgb_eADDR"
    //% color.shadow="colorNumberPicker"
    export function setRGB1(pADDR: number, color: number) {
        setRGB(pADDR, color >>> 16 & 0xFF, color >>> 8 & 0xFF, color & 0xFF)
    }


    // ========== PRIVATE function RGB

    function write2Byte(pADDR: eADDR_RGB, command: number, b1: number) {
        let b = Buffer.create(2)
        b.setUint8(0, command)
        b.setUint8(1, b1)
        i2cWriteBuffer(pADDR, b)
    }

    // ========== group="i2c Adressen"

    //% blockId=lcd16x2rgb_eADDR
    //% group="i2c Adressen" subcategory="RGB Backlight"
    //% block="%pADDR" weight=4
    export function lcd16x2rgb_eADDR(pADDR: eADDR_RGB): number { return pADDR }

    //% group="i2c Adressen" subcategory="RGB Backlight"
    //% block="i2c Fehlercode RGB" weight=2
    export function i2cError_RGB() { return n_i2cError }

    function i2cWriteBuffer(pADDR: number, buf: Buffer, repeat: boolean = false) {
        if (n_i2cError == 0) { // vorher kein Fehler
            n_i2cError = pins.i2cWriteBuffer(pADDR, buf, repeat)
            if (n_i2cCheck && n_i2cError != 0)  // vorher kein Fehler, wenn (n_i2cCheck=true): beim 1. Fehler anzeigen
                basic.showString(Buffer.fromArray([pADDR]).toHex()) // zeige fehlerhafte i2c-Adresse als HEX
        } else if (!n_i2cCheck)  // vorher Fehler, aber ignorieren (n_i2cCheck=false): i2c weiter versuchen
            n_i2cError = pins.i2cWriteBuffer(pADDR, buf, repeat)
        //else { } // n_i2cCheck=true und n_i2cError != 0: weitere i2c Aufrufe blockieren
    }

} // lcd16x2rgb.ts