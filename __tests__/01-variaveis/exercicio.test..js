const { test } = require("@jest/globals");

const exercicio01 = require("../../01-variaveis/exercicio-01")

  test('Crie uma variavel chamada carName, coloque um valor igual a "Volvo" nela.', () => {
    expect(exercicio01()).toBe("Volvo");
  });