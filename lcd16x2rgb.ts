
namespace lcd16x2rgb
/*
*/ {
    export enum eADDR_RGB { RGB_16x2_V5 = 0x30, RGB_16x2_x62 = 0x62 }


    // Code RGB Backlight ======================================

    // ========== group="RGB Backlight (nur Display mit Hintergrundfarbe)"

    //% group="RGB Backlight (nur Display mit Hintergrundfarbe)" subcategory="RGB Backlight"
    //% block="i2c %i2cADDR init RGB" weight=2
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

    //% group="RGB Backlight (nur Display mit Hintergrundfarbe)" subcategory="RGB Backlight"
    //% block="i2c %i2cADDR set RGB r %r g %g b %b" weight=1
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


} // lcd16x2rgb.ts