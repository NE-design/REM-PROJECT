# Δημιουργεί απλά PNG εικονίδια (χωρίς εξωτερικές βιβλιοθήκες).
import zlib, struct
def png(size, path):
    acc=(11,110,122); white=(255,255,255); rows=[]
    for y in range(size):
        row=bytearray([0])
        for x in range(size):
            u,v=x/size,y/size; c=acc
            roof = 0.22<v<0.50 and abs(u-0.5) < (v-0.22)*1.15
            body = 0.50<=v<0.78 and 0.30<u<0.70
            door = 0.60<v<0.78 and 0.45<u<0.55
            if (roof or body) and not door: c=white
            row+=bytes(c)
        rows.append(bytes(row))
    raw=b''.join(rows)
    def ch(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    open(path,'wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+ch(b'IDAT',zlib.compress(raw,9))+ch(b'IEND',b''))
png(192,'public/icons/icon-192.png'); png(512,'public/icons/icon-512.png')
