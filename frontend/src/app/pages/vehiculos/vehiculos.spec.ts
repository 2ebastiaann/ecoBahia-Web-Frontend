export interface Vehicle {
  id?: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidad: number;
  estado: 'ACTIVO' | 'INACTIVO' | 'MANTENIMIENTO';
  tipoVehiculo: 'BUS' | 'BUSETA' | 'MICROBUS';
  rutaAsignada?: string;
  conductorAsignado?: string;
  ultimoMantenimiento?: Date | string;
  proximoMantenimiento?: Date | string;
  kilometraje?: number;
  numeroInterno?: string;
  fechaRegistro?: Date | string;
  observaciones?: string;
}

export interface VehicleFilters {
  estado?: string;
  tipoVehiculo?: string;
  searchTerm?: string;
}

export interface VehicleStats {
  total: number;
  activos: number;
  inactivos: number;
  mantenimiento: number;
}