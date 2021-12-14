    precision mediump float;

    attribute vec4 a_position;
    attribute vec4 a_color;
    uniform float u_time;
    varying vec4 col;
    
    void main() {
        vec3 pp = (a_position).xyz;
        float time = mod(u_time/900.,70.);
        pp -= vec3(-0.450,-6.8 + 0.05*time,-28. +time);

        float w= sin(u_time/2000.)*0.3;
        float s = sin(w);
        float c = cos(w);
        pp.x = pp.x*c + pp.z*s;
        pp.z = -pp.x*s + pp.z*c;
        pp.y = 1.0*pp.y;
        gl_Position = vec4(pp,1.1*(pp.z +1.0));
        col = a_color;
    }