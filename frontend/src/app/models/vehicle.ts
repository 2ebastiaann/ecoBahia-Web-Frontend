export interface Vehicle {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidad: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'MANTENIMIENTO';
  tipoVehiculo: string;
  rutaAsignada?: string;
  conductorAsignado?: string;
  ultimoMantenimiento?: string;
  proximoMantenimiento?: string;
  kilometraje?: number;
  numeroInterno?: string;
  observaciones?: string;
  fechaRegistro?: Date;
}
