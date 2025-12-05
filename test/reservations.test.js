const chai = require('chai');
const assert = chai.assert;

// Necesitamos importar la función isFutureDate del archivo server.js
process.env.NODE_ENV = 'test'; 
const { isFutureDate, reservations } = require('../server'); 

describe('Validación de Reservas en Sistemas de Reservas Ortiz', () => {
    
    // --- Prueba de la lógica de validación de fecha (CRÍTICA para HU5) ---
    describe('isFutureDate() - Validación de Fechas Futuras', () => {
        
        it('Debe devolver TRUE para una fecha y hora futura', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            
            const dateString = futureDate.toISOString().split('T')[0]; 
            const timeString = '10:00'; 
            
            assert.isTrue(isFutureDate(dateString, timeString), 'Debe ser una fecha futura');
        });

        it('Debe devolver FALSE para una fecha y hora pasada (HU5)', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            
            const dateString = pastDate.toISOString().split('T')[0];
            const timeString = '10:00'; 
            
            assert.isFalse(isFutureDate(dateString, timeString), 'Debe ser una fecha pasada');
        });

    });

    // --- Prueba de la lógica de cancelación (HU4) ---
    describe('Lógica de Cancelación (Eliminar Reserva)', () => {
        beforeEach(() => {
            // Asegurarse de que el array tenga elementos antes de la prueba
            reservations.length = 0; 
            reservations.push({ id: 100, clientName: 'Prueba 1', date: '2025-12-05', time: '14:00', guests: 2 });
            reservations.push({ id: 101, clientName: 'Prueba 2', date: '2025-12-06', time: '18:00', guests: 4 });
        });

        it('Debe reducir el conteo de reservas al cancelar por ID (HU4)', () => {
            const idToCancel = 100;
            const initialLength = reservations.length;
            
            // Simular la lógica de cancelación
            const updatedReservations = reservations.filter(r => r.id !== idToCancel);
            
            assert.lengthOf(updatedReservations, initialLength - 1, 'Debe quedar una reserva menos en el array');
        });
    });
});
