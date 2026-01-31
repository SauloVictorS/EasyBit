/**
 * MeuRobo - Biblioteca para ensinar programação a crianças
 * Controla um robô com motores, LEDs RGB e sensores
 */

enum Cor {
    //% block="vermelho"
    Vermelho = 0,
    //% block="verde"
    Verde = 1,
    //% block="azul"
    Azul = 2,
    //% block="amarelo"
    Amarelo = 3,
    //% block="roxo"
    Roxo = 4,
    //% block="branco"
    Branco = 5,
    //% block="apagado"
    Apagado = 6
}

enum Passos {
    //% block="um"
    Um = 300,
    //% block="dois"
    Dois = 600,
    //% block="tres"
    Tres = 900,
    //% block="quatro"
    Quatro = 1200,
    //% block="cinco"
    Cinco = 1500
}

enum Volta {
    //% block="um pouquinho"
    Pouquinho = 250,
    //% block="pouco"
    Poco = 570,
    //% block="bastante"
    Bastante = 1135,
    //% block="muito"
    Muito = 2270
}

enum Lado {
    //% block="esquerda"
    Esquerda = 0,
    //% block="direita"
    Direita = 1
}

enum Distancia {
    //% block="pertinho"
    Pertinho = 10,
    //% block="perto"
    Perto = 20,
    //% block="longe"
    Longe = 50
}

enum Velocidade {
    //% block="devagar"
    Devagar = 30,
    //% block="normal"
    Normal = 50,
    //% block="rapido"
    Rapido = 70,
    //% block="muito rapido"
    MuitoRapido = 100
}

//% color="#FF6B35" icon="\uf1b9" weight=100
//% groups="['Luzes', 'Movimento', 'Sentidos', 'Emocoes', 'Avancado']"
namespace MeuRobo {

    /*******************************
     * Constantes e controle PCA9685
     *******************************/
    const PCA9685_ADDRESS = 0x47
    const MODE1 = 0x00
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06

    let PCA9685_Initialized = false
    let brilhoLED = 4095
    let ultimoTempoUltra = 0

    // Velocidade fixa dos motores: 70% de 4095
    const VELOCIDADE_MOTOR = 2870

    function i2cRead(addr: number, reg: number): number {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE)
        return pins.i2cReadNumber(addr, NumberFormat.UInt8BE)
    }

    function i2cWrite(address: number, reg: number, value: number): void {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(address, buf)
    }

    function setFreq(freq: number): void {
        let prescaleval = 25000000
        prescaleval /= 4096
        prescaleval /= freq
        prescaleval -= 1
        let prescale = prescaleval
        let oldmode = i2cRead(PCA9685_ADDRESS, MODE1)
        let newmode = (oldmode & 0x7F) | 0x10
        i2cWrite(PCA9685_ADDRESS, MODE1, newmode)
        i2cWrite(PCA9685_ADDRESS, PRESCALE, prescale)
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode)
        control.waitMicros(5000)
        i2cWrite(PCA9685_ADDRESS, MODE1, oldmode | 0xa1)
    }

    function setPwm(channel: number, on: number, off: number): void {
        let buf = pins.createBuffer(5)
        buf[0] = LED0_ON_L + 4 * channel
        buf[1] = on & 0xff
        buf[2] = (on >> 8) & 0xff
        buf[3] = off & 0xff
        buf[4] = (off >> 8) & 0xff
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf)
    }

    function initPCA9685(): void {
        i2cWrite(PCA9685_ADDRESS, MODE1, 0x00)
        setFreq(50)
        for (let idx = 0; idx < 16; idx++) {
            setPwm(idx, 0, 0)
        }
        PCA9685_Initialized = true
    }

    function ensureInit(): void {
        if (!PCA9685_Initialized) {
            initPCA9685()
        }
    }

    /*******************************
     * Funções internas de motores
     *******************************/
    function pararMotores(): void {
        setPwm(0, 0, 4095)
        setPwm(1, 0, 0)
        setPwm(2, 0, 0)
        setPwm(5, 0, 4095)
        setPwm(4, 0, 0)
        setPwm(3, 0, 0)
    }

    function moverFrenteInterno(velocidade: number, tempoMs: number): void {
        ensureInit()
        let speed = Math.map(velocidade, 0, 100, 0, 4095)
        // CORRIGIDO: Invertido para andar para frente corretamente
        setPwm(0, 0, speed)
        setPwm(1, 0, 4095)
        setPwm(2, 0, 0)
        setPwm(5, 0, speed)
        setPwm(4, 0, 4095)
        setPwm(3, 0, 0)
        if (tempoMs > 0) {
            basic.pause(tempoMs)
            pararMotores()
        }
    }

    function moverTrasInterno(velocidade: number, tempoMs: number): void {
        ensureInit()
        let speed = Math.map(velocidade, 0, 100, 0, 4095)
        // CORRIGIDO: Invertido para andar para trás corretamente
        setPwm(0, 0, speed)
        setPwm(1, 0, 0)
        setPwm(2, 0, 4095)
        setPwm(5, 0, speed)
        setPwm(4, 0, 0)
        setPwm(3, 0, 4095)
        if (tempoMs > 0) {
            basic.pause(tempoMs)
            pararMotores()
        }
    }

    function girarEsquerdaInterno(velocidade: number, tempoMs: number): void {
        ensureInit()
        let speed = Math.map(velocidade, 0, 100, 0, 4095)
        // CORRIGIDO: Gira para esquerda
        setPwm(0, 0, speed)
        setPwm(1, 0, 0)
        setPwm(2, 0, 4095)
        setPwm(5, 0, speed)
        setPwm(4, 0, 4095)
        setPwm(3, 0, 0)
        if (tempoMs > 0) {
            basic.pause(tempoMs)
            pararMotores()
        }
    }

    function girarDireitaInterno(velocidade: number, tempoMs: number): void {
        ensureInit()
        let speed = Math.map(velocidade, 0, 100, 0, 4095)
        // CORRIGIDO: Gira para direita
        setPwm(0, 0, speed)
        setPwm(1, 0, 4095)
        setPwm(2, 0, 0)
        setPwm(5, 0, speed)
        setPwm(4, 0, 0)
        setPwm(3, 0, 4095)
        if (tempoMs > 0) {
            basic.pause(tempoMs)
            pararMotores()
        }
    }

    /*******************************
     * Funções internas de LEDs
     *******************************/
    function definirCorLEDs(cor: Cor): void {
        ensureInit()

        // Apaga todos os canais dos LEDs primeiro
        setPwm(9, 0, 0)   // R esquerdo
        setPwm(10, 0, 0)  // G esquerdo
        setPwm(11, 0, 0)  // B esquerdo
        setPwm(7, 0, 0)   // R direito
        setPwm(6, 0, 0)   // G direito
        setPwm(8, 0, 0)   // B direito

        if (cor == Cor.Apagado) return

        // Vermelho
        if (cor == Cor.Vermelho || cor == Cor.Amarelo || cor == Cor.Roxo || cor == Cor.Branco) {
            setPwm(9, 0, brilhoLED)   // R esquerdo
            setPwm(7, 0, brilhoLED)   // R direito
        }
        // Verde
        if (cor == Cor.Verde || cor == Cor.Amarelo || cor == Cor.Branco) {
            setPwm(10, 0, brilhoLED)  // G esquerdo
            setPwm(6, 0, brilhoLED)   // G direito
        }
        // Azul
        if (cor == Cor.Azul || cor == Cor.Roxo || cor == Cor.Branco) {
            setPwm(11, 0, brilhoLED)  // B esquerdo
            setPwm(8, 0, brilhoLED)   // B direito
        }
    }

    /*******************************
     * 💡 LUZES
     *******************************/

    /**
     * Acende a luz do robô na cor escolhida
     * @param cor a cor da luz
     */
    //% block="acender luz $cor"
    //% group="Luzes" weight=100
    export function acenderLuz(cor: Cor): void {
        definirCorLEDs(cor)
    }

    /**
     * Apaga a luz do robô
     */
    //% block="apagar luz"
    //% group="Luzes" weight=99
    export function apagarLuz(): void {
        definirCorLEDs(Cor.Apagado)
    }

    /**
     * Pisca a luz do robô 3 vezes
     * @param cor a cor da luz
     */
    //% block="piscar luz $cor"
    //% group="Luzes" weight=98
    export function piscarLuz(cor: Cor): void {
        for (let i = 0; i < 3; i++) {
            definirCorLEDs(cor)
            basic.pause(200)
            definirCorLEDs(Cor.Apagado)
            basic.pause(200)
        }
    }

    /*******************************
     * 🚗 MOVIMENTO
     *******************************/

    /**
     * Faz o robô ir para frente (movimento contínuo)
     * @param velocidade quão rápido o robô vai
     */
    //% block="ir para frente $velocidade"
    //% group="Movimento" weight=99
    export function irParaFrente(velocidade: Velocidade): void {
        moverFrenteInterno(velocidade, 0)
    }

    /**
     * Faz o robô ir para trás (movimento contínuo)
     * @param velocidade quão rápido o robô vai
     */
    //% block="ir para tras $velocidade"
    //% group="Movimento" weight=98
    export function irParaTras(velocidade: Velocidade): void {
        moverTrasInterno(velocidade, 0)
    }

    /**
     * Faz o robô andar para frente por alguns passos e depois para
     * @param passos quantos passos andar
     */
    //% block="andar para frente $passos passos"
    //% group="Movimento" weight=97
    export function andarFrente(passos: Passos): void {
        moverFrenteInterno(70, passos)
    }

    /**
     * Faz o robô andar para trás por alguns passos e depois para
     * @param passos quantos passos andar
     */
    //% block="andar para tras $passos passos"
    //% group="Movimento" weight=96
    export function andarTras(passos: Passos): void {
        moverTrasInterno(70, passos)
    }

    /**
     * Faz o robô virar e depois para
     * @param lado para qual lado virar
     * @param quanto quanto virar
     */
    //% block="virar para $lado $quanto"
    //% group="Movimento" weight=95
    export function virar(lado: Lado, quanto: Volta): void {
        if (lado == Lado.Esquerda) {
            girarEsquerdaInterno(50, quanto)
        } else {
            girarDireitaInterno(50, quanto)
        }
    }

    /**
     * Para o robô
     */
    //% block="parar"
    //% group="Movimento" weight=94
    export function parar(): void {
        ensureInit()
        pararMotores()
    }

    /*******************************
     * 👀 SENTIDOS
     *******************************/

    /**
     * Verifica se tem algo na frente do robô
     * @param distancia quão perto precisa estar
     */
    //% block="tem algo $distancia"
    //% group="Sentidos" weight=90
    export function temAlgo(distancia: Distancia): boolean {
        ensureInit()

        pins.setPull(DigitalPin.P1, PinPullMode.PullNone)
        pins.digitalWritePin(DigitalPin.P1, 0)
        control.waitMicros(2)
        pins.digitalWritePin(DigitalPin.P1, 1)
        control.waitMicros(10)
        pins.digitalWritePin(DigitalPin.P1, 0)

        let t = pins.pulseIn(DigitalPin.P2, PulseValue.High, 35000)
        let ret = t

        if (ret == 0 && ultimoTempoUltra != 0) {
            ret = ultimoTempoUltra
        }
        ultimoTempoUltra = t

        let distanciaCm = Math.round(ret / 58)
        return distanciaCm <= distancia && distanciaCm > 0
    }

    /**
     * Verifica se o robô está no chão claro (linha branca)
     */
    //% block="esta no chao claro"
    //% group="Sentidos" weight=89
    export function chaoClaro(): boolean {
        let leitura = (pins.digitalReadPin(DigitalPin.P14) << 2) +
            (pins.digitalReadPin(DigitalPin.P15) << 1) +
            (pins.digitalReadPin(DigitalPin.P16))
        return leitura != 0
    }

    /**
     * Verifica se o botão está apertado
     */
    //% block="botao apertado"
    //% group="Sentidos" weight=88
    export function botaoApertado(): boolean {
        return pins.digitalReadPin(DigitalPin.P5) == 1
    }

    /*******************************
     * 😊 EMOÇÕES
     *******************************/

    /**
     * Faz o robô dançar!
     */
    //% block="dancar"
    //% group="Emocoes" weight=85
    export function dancar(): void {
        // Sequência divertida de movimentos e luzes
        definirCorLEDs(Cor.Amarelo)
        girarDireitaInterno(60, 250)
        definirCorLEDs(Cor.Azul)
        girarEsquerdaInterno(60, 250)
        definirCorLEDs(Cor.Verde)
        girarDireitaInterno(60, 250)
        definirCorLEDs(Cor.Roxo)
        girarEsquerdaInterno(60, 250)
        definirCorLEDs(Cor.Vermelho)
        moverFrenteInterno(50, 200)
        moverTrasInterno(50, 200)
        definirCorLEDs(Cor.Branco)
        basic.pause(300)
        definirCorLEDs(Cor.Apagado)
    }

    /**
     * Faz o robô ficar feliz!
     */
    //% block="ficar feliz"
    //% group="Emocoes" weight=84
    export function ficarFeliz(): void {
        // Pisca várias cores rapidamente
        definirCorLEDs(Cor.Amarelo)
        basic.pause(150)
        definirCorLEDs(Cor.Verde)
        basic.pause(150)
        definirCorLEDs(Cor.Azul)
        basic.pause(150)
        definirCorLEDs(Cor.Roxo)
        basic.pause(150)
        definirCorLEDs(Cor.Branco)
        basic.pause(150)
        definirCorLEDs(Cor.Amarelo)
        basic.pause(150)
        definirCorLEDs(Cor.Verde)
        basic.pause(150)
        definirCorLEDs(Cor.Apagado)
    }

    /**
     * Faz o robô ficar com medo!
     */
    //% block="ficar com medo"
    //% group="Emocoes" weight=83
    export function ficarComMedo(): void {
        // Recua e pisca vermelho
        definirCorLEDs(Cor.Vermelho)
        moverTrasInterno(70, 400)
        definirCorLEDs(Cor.Apagado)
        basic.pause(100)
        definirCorLEDs(Cor.Vermelho)
        basic.pause(100)
        definirCorLEDs(Cor.Apagado)
        basic.pause(100)
        definirCorLEDs(Cor.Vermelho)
        basic.pause(100)
        definirCorLEDs(Cor.Apagado)
    }

    /*******************************
     * 🔧 AVANÇADO
     *******************************/

    /**
     * Move o robô para frente com velocidade em porcentagem (0 a 100)
     * @param velocidade velocidade de 0 a 100
     */
    //% block="mover para frente velocidade $velocidade"
    //% velocidade.min=0 velocidade.max=100 velocidade.defl=50
    //% group="Avancado" weight=79
    export function moverFrenteVelocidade(velocidade: number): void {
        moverFrenteInterno(velocidade, 0)
    }

    /**
     * Move o robô para trás com velocidade em porcentagem (0 a 100)
     * @param velocidade velocidade de 0 a 100
     */
    //% block="mover para tras velocidade $velocidade"
    //% velocidade.min=0 velocidade.max=100 velocidade.defl=50
    //% group="Avancado" weight=78
    export function moverTrasVelocidade(velocidade: number): void {
        moverTrasInterno(velocidade, 0)
    }

    /**
     * Gira o robô para esquerda continuamente
     * @param velocidade velocidade de 0 a 100
     */
    //% block="girar para esquerda velocidade $velocidade"
    //% velocidade.min=0 velocidade.max=100 velocidade.defl=50
    //% group="Avancado" weight=77
    export function girarEsquerdaVelocidade(velocidade: number): void {
        girarEsquerdaInterno(velocidade, 0)
    }

    /**
     * Gira o robô para direita continuamente
     * @param velocidade velocidade de 0 a 100
     */
    //% block="girar para direita velocidade $velocidade"
    //% velocidade.min=0 velocidade.max=100 velocidade.defl=50
    //% group="Avancado" weight=76
    export function girarDireitaVelocidade(velocidade: number): void {
        girarDireitaInterno(velocidade, 0)
    }

    /**
     * Move o robô para frente por um tempo específico em milissegundos
     * @param velocidade velocidade de 0 a 100
     * @param tempo tempo em milissegundos
     */
    //% block="mover para frente velocidade $velocidade por $tempo ms"
    //% velocidade.min=0 velocidade.max=100 velocidade.defl=50
    //% tempo.min=0 tempo.defl=500
    //% group="Avancado" weight=75
    export function moverFrenteTempo(velocidade: number, tempo: number): void {
        moverFrenteInterno(velocidade, tempo)
    }

    /**
     * Move o robô para trás por um tempo específico em milissegundos
     * @param velocidade velocidade de 0 a 100
     * @param tempo tempo em milissegundos
     */
    //% block="mover para tras velocidade $velocidade por $tempo ms"
    //% velocidade.min=0 velocidade.max=100 velocidade.defl=50
    //% tempo.min=0 tempo.defl=500
    //% group="Avancado" weight=74
    export function moverTrasTempo(velocidade: number, tempo: number): void {
        moverTrasInterno(velocidade, tempo)
    }

    /**
     * Distancia medida pelo sensor ultrassonico em centimetros
     */
    //% block="distancia em cm"
    //% group="Avancado" weight=73
    export function distanciaCm(): number {
        ensureInit()

        pins.setPull(DigitalPin.P1, PinPullMode.PullNone)
        pins.digitalWritePin(DigitalPin.P1, 0)
        control.waitMicros(2)
        pins.digitalWritePin(DigitalPin.P1, 1)
        control.waitMicros(10)
        pins.digitalWritePin(DigitalPin.P1, 0)

        let t = pins.pulseIn(DigitalPin.P2, PulseValue.High, 35000)
        let ret = t

        if (ret == 0 && ultimoTempoUltra != 0) {
            ret = ultimoTempoUltra
        }
        ultimoTempoUltra = t

        return Math.round(ret / 58)
    }

    /**
     * Leitura bruta dos sensores de linha (0 a 7)
     */
    //% block="leitura sensores de linha"
    //% group="Avancado" weight=72
    export function leituraSensoresLinha(): number {
        let leitura = (pins.digitalReadPin(DigitalPin.P14) << 2) +
            (pins.digitalReadPin(DigitalPin.P15) << 1) +
            (pins.digitalReadPin(DigitalPin.P16))
        return leitura
    }

    /**
     * Define o brilho dos LEDs (0 a 255)
     * @param brilho brilho de 0 a 255
     */
    //% block="definir brilho dos LEDs $brilho"
    //% brilho.min=0 brilho.max=255 brilho.defl=255
    //% group="Avancado" weight=71
    export function definirBrilho(brilho: number): void {
        ensureInit()
        brilhoLED = Math.map(brilho, 0, 255, 0, 4095)
    }

    /**
     * Controla cada motor separadamente
     * @param ladoEsquerdo velocidade do motor esquerdo (-100 a 100)
     * @param ladoDireito velocidade do motor direito (-100 a 100)
     */
    //% block="motor esquerdo $ladoEsquerdo direito $ladoDireito"
    //% ladoEsquerdo.min=-100 ladoEsquerdo.max=100 ladoEsquerdo.defl=50
    //% ladoDireito.min=-100 ladoDireito.max=100 ladoDireito.defl=50
    //% group="Avancado" weight=70
    export function controlarMotores(ladoEsquerdo: number, ladoDireito: number): void {
        ensureInit()

        // Motor esquerdo (canais 0, 1, 2)
        let speedE = Math.map(Math.abs(ladoEsquerdo), 0, 100, 0, 4095)
        if (ladoEsquerdo > 0) {
            // Para frente
            setPwm(0, 0, speedE)
            setPwm(1, 0, 4095)
            setPwm(2, 0, 0)
        } else if (ladoEsquerdo < 0) {
            // Para trás
            setPwm(0, 0, speedE)
            setPwm(1, 0, 0)
            setPwm(2, 0, 4095)
        } else {
            // Parado
            setPwm(0, 0, 4095)
            setPwm(1, 0, 0)
            setPwm(2, 0, 0)
        }

        // Motor direito (canais 3, 4, 5)
        let speedD = Math.map(Math.abs(ladoDireito), 0, 100, 0, 4095)
        if (ladoDireito > 0) {
            // Para frente
            setPwm(5, 0, speedD)
            setPwm(4, 0, 4095)
            setPwm(3, 0, 0)
        } else if (ladoDireito < 0) {
            // Para trás
            setPwm(5, 0, speedD)
            setPwm(4, 0, 0)
            setPwm(3, 0, 4095)
        } else {
            // Parado
            setPwm(5, 0, 4095)
            setPwm(4, 0, 0)
            setPwm(3, 0, 0)
        }
    }
}

